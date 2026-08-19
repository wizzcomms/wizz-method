# -*- coding: utf-8 -*-
"""align.py — timestamps palavra a palavra CONFIÁVEIS para narração TTS.

Uso:
    .venv/bin/python align.py <audio.mp3> <texto.txt> [saida.json]

1. Roda o ctc-forced-aligner (MMS/CTC) com o TEXTO EXATO do roteiro.
2. Encosta as bordas das palavras nos silêncios reais (ffmpeg silencedetect):
   palavra que termina dentro de um silêncio termina onde o silêncio começa;
   palavra que começa dentro de um silêncio começa onde o silêncio termina.
3. Grava JSON [{"text","start","end","score"}].
"""
import json, re, subprocess, sys, os

def silencios(audio, noise="-35dB", dur=0.30):
    out = subprocess.run(["ffmpeg","-hide_banner","-i",audio,
        "-af",f"silencedetect=noise={noise}:d={dur}","-f","null","-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends   = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(starts, ends))

def alinhar(audio, texto_path):
    here = os.path.dirname(os.path.abspath(__file__))
    cli = os.path.join(here, ".venv", "bin", "ctc-forced-aligner")
    r = subprocess.run([cli, "--audio_path", audio, "--text_path", texto_path,
        "--language", "por", "--split_size", "word", "--romanize",
        "--device", "cpu"], capture_output=True, text=True)
    saida = os.path.splitext(audio)[0] + ".json"
    if not os.path.exists(saida):
        sys.exit(f"aligner falhou:\n{r.stderr[-1500:]}")
    d = json.load(open(saida))
    segs = d if isinstance(d, list) else d["segments"]
    for ext in (".json", ".txt"):
        p = os.path.splitext(audio)[0] + ext
        if os.path.exists(p): os.remove(p)
    return segs

def encostar(segs, sils):
    novo = []
    for w in segs:
        s, e = w["start"], w["end"]
        for ss, se in sils:
            if ss <= s <= se: s = se
            if ss <= e <= se: e = ss
            if s < ss and e > se: e = ss
        if e <= s: e = s + 0.05
        novo.append({"text": w["text"], "start": round(s,3), "end": round(e,3),
                     "score": round(w.get("score",0),4)})
    return novo

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    audio, texto = sys.argv[1], sys.argv[2]
    destino = sys.argv[3] if len(sys.argv) > 3 else os.path.splitext(audio)[0] + ".alinhado.json"
    segs = alinhar(audio, texto)
    sils = silencios(audio)
    novo = encostar(segs, sils)
    json.dump(novo, open(destino,"w",encoding="utf-8"), ensure_ascii=False, indent=1)
    ruins = [w for w in novo if w["score"] < -1.0]
    print(f"{len(novo)} palavras -> {destino} | {len(sils)} silencios usados como ancora")
    if ruins:
        print(f"atencao: {len(ruins)} palavras com score baixo (conferir): " +
              ", ".join(f"{w['text']}@{w['start']:.1f}" for w in ruins[:8]))
