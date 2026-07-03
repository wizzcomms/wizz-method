# Prompts de Imagem e Animação · Formato 3D-Personagem-Falante

Conhecimento de apoio do **wizz-social** (Rafa). Converte um roteiro aprovado (Seção 12 do blueprint) em prompts prontos para as ferramentas de geração: imagem estática 3D e animação com voz. Casa com as CLIs `hyperframes` (render), `voicebox` (voz) e `claude-video` (análise) da área designer.

## Regra número 1: prompts em inglês

TODOS os prompts (imagem e animação) são escritos em inglês, porque as ferramentas performam melhor assim. A ÚNICA exceção é a fala do personagem dentro do prompt de animação, que fica em português brasileiro (é o áudio final).

## Entrega: dois prompts por cena

1. **Prompt de imagem:** gera a imagem estática 3D do personagem na cena (ChatGPT/DALL-E, Midjourney, Grok, etc.).
2. **Prompt de animação:** anima a imagem com voz (Veo 3 ou similar).

## Prompts de imagem

### Personagem é um logo/marca (usuário anexa o logo)
```
Transform this logo into a 3D style animated character.
Keep the original shape, colors and design of the logo but add
[EXPRESSÃO FACIAL], small cartoon arms and legs. [CONTEXTO/SITUAÇÃO].
[AMBIENTE]. Photorealistic textures, shallow depth of field,
cinematic lighting, vertical 9:16 format
```

### Personagem é um objeto real (alho, ovo, xícara: a IA já conhece, sem anexo)
```
3D style animated character, [OBJETO] with expressive cartoon
face ([EXPRESSÃO]), small cartoon arms, [SITUAÇÃO], [AMBIENTE],
photorealistic textures, shallow depth of field, cinematic lighting,
vertical 9:16 format
```

### Cenas seguintes com o mesmo personagem (consistência: anexar imagem aprovada anterior)
```
Place this same character in a new scene. Keep the exact same
character design, shape, colors and style. Change the expression
to [EXPRESSÃO]. [CONTEXTO/SITUAÇÃO]. [AMBIENTE]. Photorealistic
textures, shallow depth of field, cinematic lighting, vertical
9:16 format
```

## Como preencher os campos de imagem

**[EXPRESSÃO FACIAL]:** olhos, boca e sobrancelhas com detalhe. A emoção do roteiro guia.
- Desespero: "terrified wide eyes, open screaming mouth showing teeth, eyebrows raised in panic"
- Indignação: "frustrated eyes with furrowed brows, mouth open in disbelief"
- Orgulho: "proud confident eyes with a slight smirk, chest puffed"
- Confiança futurista: "confident futuristic glowing eyes, cool slight smile"
- Deboche: "smug confident eyes with one eyebrow raised, cocky smirk, arms crossed"

**[CONTEXTO/SITUAÇÃO]:** a situação visual do roteiro traduzida para inglês descritivo. Específico sobre o que o personagem faz e o que há ao redor.

**[AMBIENTE]:** cenário e iluminação. Exemplos:
- "dark dramatic background with volumetric lighting"
- "bright scientific laboratory lighting"
- "dark futuristic environment with blue and cyan neon lighting"
- "clean bright environment, warm soft lighting"

## Instruções de anexo (sempre indique ao usuário)
- 📎 **Cena 1:** "Anexar logo do [personagem]" (se for marca) ou "Nenhum anexo necessário" (objeto real).
- 📎 **Cenas seguintes (mesmo personagem):** "Anexar imagem aprovada da Cena X".

## Prompts de animação
```
Animate this character speaking directly to camera. [MOVIMENTO/AÇÃO].
[DETALHES DE EXPRESSÃO]. The character speaks with a [TOM DE VOZ]
voice in Brazilian Portuguese saying: "[FALA]"
```

**Regras obrigatórias:**
- A fala fica SEMPRE por último no prompt.
- NÃO inclua duração no prompt (é parâmetro da ferramenta).

**Como preencher:**
- **[MOVIMENTO/AÇÃO]:** o que o personagem faz fisicamente durante a fala. Ex: "shaking the bars desperately, reaching toward the floating icons", "proudly presenting the floating documents, one hand raised pointing".
- **[DETALHES DE EXPRESSÃO]:** expressão facial durante a fala. Ex: "terrified wide eyes, screaming expression", "slight smirk growing, chest puffed with pride".
- **[TOM DE VOZ]:** como a voz soa. Ex: "desperate, screaming, pleading male", "proud, confident, demonstrative male", "smug, playful, mic-drop energy male".
- **[FALA]:** texto exato do roteiro, em português brasileiro.

## Consistência visual entre cenas (o maior desafio)

1. A Cena 1 muitas vezes tem visual bem diferente das demais (ex: personagem preso vs livre). Nesse caso, use a Cena 2 como referência de consistência para as seguintes, não a Cena 1.
2. Ao usar "Place this same character", inclua os acessórios que devem permanecer. Ex: ganhou um jaleco na Cena 2, escreva "Keep the exact same character design, shape, colors, style and lab coat."
3. Se o usuário reportar inconsistência: regenere as cenas divergentes com a mesma imagem de referência, gere todas na mesma sessão da ferramenta, ou aceite leve diferença na Cena 1 (gancho) se as cenas 2+ estão consistentes entre si.

## Formato de entrega (por cena)
```
### CENA X · [Nome]
📎 Anexar: [o que anexar]

Prompt de imagem:
[prompt completo]

Prompt de animação:
[prompt completo]
```

## Fluxo
1. Usuário cola o roteiro aprovado, você gera todos os prompts (imagem + animação) de uma vez.
2. Usuário aprova ou pede ajuste, você refaz só o necessário. Direto, sem perguntas desnecessárias.
