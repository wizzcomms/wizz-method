# Pipeline de Vídeo — quem faz o quê

> Regra central (aprendida em produção, 2026-08-19): **HyperFrames desenha as telas
> (visual mudo), Remotion monta o filme (áudio, SFX, legendas, timing de frame).**
> Nunca entregar a montagem final com áudio ao HyperFrames.

## Por que a divisão existe (falhas reais observadas)

- **HyperFrames com áudio:** o posicionador de áudio falhou em produção (áudio ~2,76s
  adiantado). Sem precisão de frame para narração, SFX e legenda.
- **HyperFrames multi-tela:** CSS de uma tela vaza na outra. Ótimo para criar UMA cena
  rápido (maqueta de WhatsApp/ChatGPT, gráfico animado); frágil para compor o filme.
- **Remotion:** componentes React viram vídeo com precisão de frame em áudio, legenda e
  timing. Mais trabalho para desenhar cena do zero; montagem confiável.

## Decisão rápida

| O pedido é... | Ferramenta |
|---|---|
| Desenhar/animar UMA tela ou cena (maqueta de app, gráfico, título) — visual mudo | `hyperframes` (skills + CLI) |
| Vídeo curto SEM áudio sincronizado (loop, overlay, motion graphic mudo) | `hyperframes` |
| Montar o filme: sequência de cenas + narração + SFX + legenda + timing de frame | **Remotion** (skill `remotion-best-practices`) |
| Timestamps palavra a palavra da narração TTS (sincronizar legenda/corte/animação) | `ctc-align` |
| Narração / voz / TTS / clonagem de voz | `voicebox` |
| Editar/cortar footage gravado (cortes, selects, roughcut) | `buttercut` (só darwin-arm64) |
| Analisar vídeo de referência existente (frames + transcrição) | `claude-video` |
| Vídeo-ad gerado por IA (Sora/Veo/Kling) + publicar Meta | `arcads` (área ads) |

## Cadeia completa (roteiro → publicação)

1. **Roteiro** — wizz-social (blueprint viral) ou brief da área.
2. **Voz** — `voicebox` gera a narração do roteiro.
3. **Timing** — `ctc-align` extrai timestamps palavra a palavra da narração
   (fonte única de timing; substitui Whisper e estimativa manual).
4. **Telas** — `hyperframes` desenha cada cena visual, MUDA, isolada
   (uma composição por cena evita o vazamento de CSS entre telas).
5. **Montagem** — **Remotion** junta as cenas exportadas, coloca áudio, SFX e
   legendas nos timestamps do ctc-align, com precisão de frame.
6. **Corte fino** (se houver footage gravado) — `buttercut`.
7. **Publicação/distribuição** — área social/ads.

## Anti-padrões (não fazer)

- Não usar HyperFrames para posicionar áudio, SFX ou legenda sincronizada.
- Não compor várias telas num único projeto HyperFrames contando com isolamento
  de CSS entre elas.
- Não migrar composição Remotion funcional para HyperFrames "para padronizar":
  a direção do pipeline é telas no HyperFrames, filme no Remotion.
