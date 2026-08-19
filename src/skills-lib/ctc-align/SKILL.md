---
name: ctc-align
description: Timestamps palavra a palavra confiáveis para narração TTS via alinhamento forçado (ctc-forced-aligner + âncora nos silêncios reais). Usar SEMPRE antes de definir tempo de legenda, corte de cena, animação ou elemento sincronizado com fala em qualquer vídeo (HyperFrames ou outro editor). Substitui o Whisper como fonte de timing quando o texto do roteiro é conhecido. Gatilhos - sincronizar legenda, timing de cena, alinhar áudio e texto, palavra a palavra, forced alignment, legenda karaokê, corrigir sync de vídeo.
---

# ctc-align — timing de fala como fonte única de verdade

## Quando usar

Sempre que um vídeo tiver narração cujo TEXTO é conhecido (roteiro de TTS, VSL,
explainer) e for preciso decidir QUANDO algo aparece: legenda, corte de cena,
animação, texto na tela.

**Regra do método: nunca estimar tempo à mão e nunca confiar no timestamp do Whisper.**
O Whisper adivinha as palavras e deriva (medido: até 6s); interpolação proporcional
entre silêncios desloca palavras para o bloco vizinho. O alinhamento CTC recebe o texto
exato e só procura onde cada palavra está: precisão de dezenas de ms.

## Instalação (uma vez por projeto)

    mkdir -p tools/ctc-align && cd tools/ctc-align
    uv venv --python 3.12 .venv
    uv pip install --python .venv/bin/python "git+https://github.com/MahmoudAshraf97/ctc-forced-aligner.git"

Copiar o `scripts/align.py` desta skill para `tools/ctc-align/align.py`.
Roda em CPU (Mac ARM ok, sem CUDA). Primeiro uso baixa o modelo MMS (~1GB).

## Uso

1. Gerar um .txt com o roteiro EXATO que o TTS falou (texto corrido; se o TTS falou
   diferente do escrito, usar o que foi FALADO).
2. Rodar:

    tools/ctc-align/.venv/bin/python tools/ctc-align/align.py narracao.mp3 roteiro.txt transcript.json

Saída: JSON [{"text","start","end","score"}] por palavra, bordas já encostadas nos
silêncios reais (silencedetect embutido). Score perto de 0 = confiável; o helper avisa
palavras com score < -1.0 (conferir de ouvido).

## Como converter em tempos de cena/legenda

- Legenda: usar start/end da palavra direto.
- Corte de cena/elemento: âncora = start da PRIMEIRA palavra da frase que o elemento
  ilustra. Buscar a palavra de forma MONOTÔNICA (cada âncora procurada a partir da
  anterior), nunca busca global — palavra repetida ("10", "bónus") pega ocorrência errada.
- Duração mínima de cena: 1,2s; se a frase for mais curta, empurrar a próxima cena
  dentro da própria frase dela.
- Nada aparece antes de ser mencionado; nada continua depois que o assunto mudou.

## QA obrigatório antes do render

Nenhuma palavra pode sobrepor o miolo de um silêncio real, e cada fim de frase do
roteiro deve terminar num silêncio. Medir isso, não o desvio de âncoras que o próprio
método criou. Áudio concatenado de blocos: alinhar bloco a bloco ou conferir fronteiras.

## Limitações honestas

- Precisa do texto exato; não transcreve. Áudio sem roteiro: transcrever com Whisper,
  revisar o texto à mão e SÓ ENTÃO alinhar com este fluxo.
- Acentos exigem a flag --romanize (o helper já passa).
