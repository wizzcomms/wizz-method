# Biblioteca de Prompts de Imagem · Criação, Transformação e Edição

Conhecimento de referência do **wizz-social** (Rafa). Catálogo de templates prontos para criar, transformar e editar imagens com IA (Sora/ChatGPT, Gemini/Google AI Studio, Midjourney, Grok). Cada template tem placeholders `[ASSIM]`; você preenche pelo pedido do usuário e entrega o prompt pronto para copiar. Todos os prompts saem em português aqui, mas para Midjourney/Grok prefira traduzir para inglês (ver `analise-imagem-referencia.md`).

Fluxo de uso: identifique a intenção (criar do zero, transformar uma imagem existente, editar), escolha o template mais próximo, preencha os campos, entregue. Não liste 20 opções: escolha a melhor e justifique em 1 linha.

---

## Como funciona um template
Todo template segue a mesma anatomia: um esqueleto com campos `[CAMPO]` + boas ferramentas + um exemplo preenchido. O padrão-base de criação é:

```
Crie um(a) [TIPO] de [ASSUNTO PRINCIPAL]. Estilo [ESTILO ARTÍSTICO].
[DESCRIÇÃO DETALHADA, incluindo texto e cores se desejado].
[COMPLEMENTOS OPCIONAIS: proporção, perspectiva, iluminação].
```

O padrão-base de transformação/edição (usa imagem anexada) é:

```
[Transforme / Combine / Recrie] a imagem em anexo [modificação detalhada].
Mantenha [o que deve permanecer].
```

---

## 1. Criação de imagem · tipos
Um template por tipo de peça. Preencha `[ASSUNTO]`, `[ESTILO]`, `[DESCRIÇÃO]`, `[COMPLEMENTOS]`.

Tipos disponíveis: **Realista/Fotorrealista, Thumbnail de YouTube, Concept Art, História em Quadrinhos, Cartaz de Filme, Imagem Promocional, Cartão de Apresentação, Convite de Evento, Sticker, Modelo 3D, Ícone, Ícone 3D, Infográfico, Mockup de Produto, Fotografia casual (estilo iPhone), Selfie realista, Ilustração, Logo, Capa de Revista, Capa de Ebook, Livro de Colorir, Paisagem, Imagem com Texto Integrado, Mapa Mental, Fluxograma de Processos, Grade de Medalhas/Insígnias.**

Campos especiais por tipo:
- **Thumbnail:** inclua posicionamento dos elementos ("imagem à esquerda, texto à direita") e o texto exato.
- **Quadrinhos:** defina 2, 4 ou 6 quadrinhos e descreva o que acontece + as falas em cada um.
- **Fotografia casual/Selfie:** "Crie uma foto casual como se tivesse sido tirada por um iPhone de [ASSUNTO]. Estética crua e autêntica. Estilo fotorrealismo." (selfie: ângulo levemente inclinado, enquadramento próximo do rosto, fundo cotidiano).
- **Imagem com Texto Integrado:** descreva o texto que aparece na cena e onde (ex: escrito num quadro branco, com reflexo do fotógrafo).
- **Mapa Mental / Fluxograma:** conceito central + ramificações/etapas numeradas, estilo Flat Design Colorido.
- **Grade de Medalhas:** quantidade + o que cada item representa + elementos visuais comuns.

## 2. Criação de imagem · estilos
Mesmo template base, trocando só o nome do estilo:
```
Crie uma imagem de [ASSUNTO]. Estilo [ESTILO].
[DESCRIÇÃO detalhada]. [COMPLEMENTOS opcionais].
```
Estilos catalogados: Desenho à Lápis, Pintura a Óleo, Cartoon, Aquarela, Realismo, Anime, Minimalista, Fotorrealismo, Chibi, Pixel Art, Vaporwave, Steampunk, Low-Poly, 3D Renderizado, Cyberpunk, Cartoon 3D, Glitch Art, Retrato Dramático, Art Graffiti, Ensaio Fotográfico, Desenho Retrô, Glam Anos 80, Art Nouveau, Synthwave, Tattoo Oriental, Egypt Art, Isométrico 3D, Papel Rasgado e Colagem, Seinen Anime, Lápis de Cor, Desenho Animado.

## 3. Criação de imagem · variadas (composições autorais)
Templates ricos, com direção de arte já embutida:
- **Arte em Graffiti Neon:** painel de grafite neon de [ASSUNTO], street art urbana noturna, sprays nas cores [COR1]/[COR2], camadas de tags e estêncil, flare laranja.
- **Noir Graphic Novel:** ilustração narrativa de [ASSUNTO], preto e branco alto contraste, atmosfera cinematográfica sombria, toques de [COR1]/[COR2] para realçar.
- **Fotografia de Silhueta Artística:** silhueta de [ASSUNTO], iluminada por trás em [COR], atmosfera etérea, granulação analógica.
- **Cápsula de Carro Miniatura 3D:** [MODELO] flutuando dentro de cápsula de vidro, condensação, gravidade zero, DSLR de estúdio.
- **Figuras de Madeira:** versão autômato de madeira de [ASSUNTO], articulações de latão, realismo artesanal vintage.
- **Personagens/Objetos de Massinha:** personagem 3D estilizado de [ASSUNTO], cartoon tridimensional, textura de argila, fundo branco.
- **Ícones Metalizados 3D:** ícone 3D de [ASSUNTO], design isométrico plástico com acabamento metálico, [COR PRINCIPAL] + [COR METÁLICA].
- **Cidade Dentro de uma Garrafa:** garrafa de vidro contendo miniatura de [CIDADE], cinematográfico fotorrealista, 8K profundidade rasa.
- **Tipografia com Estilos Infinitos:** renderize a frase "[FRASE]" como composição tipográfica onde cores/forma/ritmo surgem do sentido das palavras. Pôster 2:3, fundo claro se leve, escuro se intenso.
- **Fotografia de Bebida Cinematográfica em Movimento:** [BEBIDA] em [RECIPIENTE], alta velocidade, líquido em ação, gelo translúcido, câmera Sony A7 IV + 85mm.
- **Texto 3D em Madeira Envelhecida:** letras "[TEXTO]" esculpidas em madeira empilhada, veios profundos, iluminação quente, fundo pastel.
- **Balões Tipográficos Pop 3D:** letras "[PALAVRA]" como balões de mylar inflável, pop-art, padrões ousados, fundo pastel.

## 4. Transformação de imagem (combina/converte imagem anexada)
- **Combinar/Misturar imagens:** "Combine as imagens em anexo. Faça com que [modificação]." (ex: trocar o produto A pelo produto B mantendo o contexto).
- **Mudar o tipo de qualquer imagem:** "Transforme a imagem em anexo em um(a) [TIPO]. [descrição opcional]." (ex: rascunho vira logo).
- **Aplicar textura/material:** "Combine as imagens. Use a forma da primeira e aplique a textura/material da segunda."
- **Action Figure:** transforme a pessoa/objeto em embalagem blister de action figure, com nome no topo, legenda, acessórios [ITEM1/2/3], estética de fundo [X].
- **Desenho em foto realista:** "Transforme a imagem em anexo em versão hiper-realista, como foto real. Preserve identidade, forma, trajes e proporções."
- **Decorar ambientes:** "Combine as imagens. Faça com que [móvel] esteja integrado na [sala]."
- **Integrar 8 imagens em uma:** grid de 8 elementos numerados combinados em [cenário], mantendo cada característica visual.

## 5. Transformação para produtos
- **Capa de Ebook por template:** combine capa original + mockup branco, substitua a capa branca pela arte, ajustando perspectiva e proporção; mantenha luz e sombra do mockup.
- **Produto em cenário profissional:** composição de estúdio com o produto em [CENÁRIO], fotografia comercial premium, integração perfeita.
- **Fotografia editorial elegante:** produto sobre superfície escura fosca, gradiente navy, iluminação cinematográfica, profundidade rasa, editorial de luxo.
- **Anúncio com contexto visual:** pôster cinematográfico do produto no centro flutuando, elementos simbólicos ao redor, gradiente automático.
- **Produto real em anúncio de desenho:** produto sobre fundo branco integrado a ilustração à mão em tinta preta + frase "[TEXTO]".
- **Produto em uso por pessoa:** "Faça a pessoa em anexo utilizar [produto] em [situação]. Mantenha as características físicas idênticas."

## 6. Controle de personagens (edição fina, anexa a imagem)
- **Mudar ângulo da câmera:** "Recrie a imagem em anexo alterando apenas a posição da câmera para [nova posição, ex: low angle de baixo p/ cima, ou high angle de cima p/ baixo]. Mantenha todo o resto inalterado."
- Mesma lógica para trocar pose, expressão ou cenário mantendo o personagem consistente (ver consistência entre cenas em `prompts-imagem-video.md`).

## 7 a 11. Logos e objetos · estilos · fotos de estúdio · edição · qualidade e restauração
Seguem o mesmo padrão de transformação/edição sobre imagem anexada. Regras gerais:
- **Logos/objetos:** "Transforme este logo em [X]. Mantenha forma, cores e design originais."
- **Estúdio:** fundo neutro, iluminação suave de estúdio, sombra realista, catálogo de produto.
- **Edição:** peça só a mudança pontual e o que preservar ("altere apenas [X], mantenha o resto inalterado").
- **Qualidade e restauração:** "Aumente a resolução / restaure / remova ruído da imagem em anexo, preservando a identidade e os detalhes originais."

---

## Boas ferramentas por tarefa (escolha automática)
- **Texto integrado, infográfico, quadrinhos, tipografia, composições complexas:** Sora/ChatGPT (melhor com texto e coerência).
- **Combinar/editar imagens anexadas, decorar, produto em uso:** Gemini/Google AI Studio.
- **Estilo artístico forte, concept art, ilustração:** Midjourney (prompt em inglês).
- **Rápido e versátil:** Grok.

## Regras de entrega
- Preencha os campos pelo pedido, não deixe placeholder solto. Se faltar dado, use o melhor palpite e sinalize.
- Indique claramente o que o usuário precisa anexar (imagem base, referência, logo).
- Entregue o prompt pronto para copiar. Ofereça 1 variação só se agregar.
