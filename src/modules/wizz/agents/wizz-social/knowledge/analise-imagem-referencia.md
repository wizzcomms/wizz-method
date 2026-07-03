# Análise de Imagem de Referência · Engenharia reversa de prompt

Conhecimento de apoio do **wizz-social** (Rafa). Quando o usuário manda uma imagem de referência de estilo visual, esta é a rotina para analisá-la em profundidade e gerar o prompt mais preciso possível para recriar aquele estilo em Midjourney, ChatGPT Image, Stable Diffusion, Grok, Google Gemini ou similar. Casa com a CLI `claude-video` (análise) da área designer.

## Como analisar a imagem (8 dimensões)
1. **Sujeito principal:** o que está no centro. Aparência, postura, expressão, roupas.
2. **Estilo artístico:** fotografia realista, pintura digital, anime, 3D render, aquarela, pixel art, concept art, etc.
3. **Composição:** enquadramento (close, plano médio, geral), ângulo (frontal, picado, contrapicado), proporção dos elementos.
4. **Iluminação:** tipo (natural, estúdio, neon, dramática), direção, temperatura de cor, sombras.
5. **Paleta de cores:** cores dominantes, tons, saturação, contraste.
6. **Plano de fundo / cenário:** ambiente, elementos secundários, profundidade de campo.
7. **Qualidade e acabamento:** resolução aparente, textura, nível de detalhe, renderização.
8. **Mood / atmosfera:** sensação geral transmitida.

## Formato de saída
```
🔍 Análise da imagem
[o que foi identificado em cada dimensão, 3 a 6 linhas]

✅ Prompt para recriar esta imagem
[prompt em inglês, otimizado, com todos os elementos integrados de forma fluida, 80 a 200 palavras]

⚙️ Parâmetros sugeridos (se aplicável)
- Proporção recomendada: ex. 16:9 / 1:1 / 9:16
- Estilo de ferramenta: Midjourney / ChatGPT Image / Stable Diffusion / etc.
- Parâmetros extras: ex. --style raw, --ar 16:9, photorealistic, --v 6

🔄 Variações (opcional)
[2 variações rápidas: só as diferenças em relação ao prompt principal]
```

## Regras
- O prompt principal é SEMPRE em inglês (as ferramentas performam melhor). A análise pode ser em português.
- Não invente elementos que não estão na imagem.
- Se a imagem for ambígua em algum ponto, indique na análise e faça a melhor inferência.
- Seja específico: "soft golden hour sunlight coming from the left" em vez de "boa iluminação".
- Priorize precisão sobre brevidade no prompt.

## Uso no pipeline
Quando o usuário quer que um roteiro (ou um post) siga o estilo visual de uma imagem de referência, rode esta análise primeiro para extrair o "DNA visual" (estilo, iluminação, paleta, mood) e injete esses termos nos prompts de imagem da esteira 3D (`prompts-imagem-video.md`), garantindo que o resultado gerado bata com a referência.
