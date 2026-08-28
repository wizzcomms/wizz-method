## 4A. Criativos — produção com IA

> Shard da metodologia desta base. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Onde a skill genérica contradisser este shard, **o shard vence**, e isso deve ser dito na resposta.

**O que tem aqui:** `4.6` realismo em vídeo com IA · `4.9` imagens e avatares realistas · `4.13` avatares de fala, continuação de cena e pipeline sem marca d'água
**Irmãos:** fundamentos em [`04-criativos.md`](04-criativos.md) · roteiro, moldes e swipe file em [`04b-criativos-formatos.md`](04b-criativos-formatos.md)
**Atenção:** avatar de IA passando por pessoa real é tática bloqueada — ver [guardrails 21](guardrails.md).

### 4.6 Realismo em vídeo com IA

> ⚠️ Avatar realista de IA: ver [guardrails 21](guardrails.md) antes de apresentar avatar gerado como se fosse pessoa real em anúncio.

Duas ferramentas, funções distintas: **Dream Face** para sincronia labial (avatar falando) e **Eleven Labs** para geração de voz.

**As 3 regras de ouro do realismo** (falhar em uma quebra a ilusão inteira):

1. **Cenário natural.** Vídeo base realista, não pessoa parada de frente para a câmera.
2. **Voz combinando com a entonação** da pessoa no vídeo original.
3. **Gestos acompanhando exatamente o que está sendo dito.** Gesticulação descolada da fala é o erro mais visível.

**Operação:**

- Usar avatar pré-existente ou carregado no Dream Face dá lip sync mais natural do que subir só uma foto.
- Versão gratuita do Dream Face limita a 30s; acima disso exige o plano Pro.
- **Dividir a copy em trechos de 3 a 4 linhas** em vez de colar texto longo inteiro. Áudio fica mais estável.
- Treinar a voz com áudio isolado e limpo (podcast, por exemplo), nunca com ruído de fundo.
- Conferir pronúncia: erro de pronúncia é a falha que mais denuncia IA.

### 4.9 Imagens e avatares realistas com IA — Google Flow

> ⚠️ **Avatar de IA como pessoa real — confirmar antes de usar.** Meta e Instagram exigem que conta representando pessoa fictícia seja identificável como tal, e a regra varia por formato e por país (mais dura em Portugal e na UE, ver 4.8). O material de origem não trata disso. Avatar de IA como recurso visual declarado, sim; avatar de IA apresentado como pessoa real em anúncio, **não sem confirmar a política do mercado alvo**. Ver [guardrails 21](guardrails.md).

Complementa a 4.6 (que trata de vídeo falado com Dream Face + Eleven Labs). Aqui o objeto é **gerar a foto/avatar**, para perfil ou para criativo.

**Ferramenta:** **Google Flow** — gratuita, gera foto e vídeo direto no navegador. Modelo de imagem citado na aula: "NanoBandana 2".

**Configuração:**

- Proporção **3:4 para feed**, **9:16 para stories**.
- Gerar **4 fotos por rodada** para ter de onde escolher.

**Fluxo:**

1. Usar o ChatGPT para descrever a imagem desejada em **JSON realista** (prompt estruturado, não frase solta).
2. Colar o JSON no Google Flow.
3. Se a consistência facial falhar (a IA não incorpora a foto de referência sozinha), usar o recurso manual **"add to prompt"** para forçar a referência.

**Benchmark de qualidade citado:** o perfil "Deborah Nowalski" foi usado na aula como padrão de realismo a atingir.

> Vale para as 3 regras de ouro da 4.6: cenário natural, voz combinando com a entonação e gesto acompanhando a fala. Foto realista com vídeo mal sincronizado continua quebrando a ilusão.
>
> 💡 **Prompt literal:** O prompt base em inglês para selfie realista com microexpressões, gestos naturais e iluminação suave foi fornecido na aula de 2026-08-25 e está registrado na íntegra na seção 4.13 deste shard.

### 4.13 Avatares de Fala, Continuação de Cenas e Pipeline sem Marca d'Água

Material da aula prática focada na criação de vídeos com avatares falantes ultra-realistas com ferramentas gratuitas, técnicas de consistência frame-a-frame e pós-produção:

1. **Stack Integrada de Ferramentas (100% Gratuita):**
 - **Google Flow:** Geração da imagem base do avatar em 4 variações a partir de prompt descritivo.
 - **DreamFace:** Lip-sync / sincronia labial, microexpressões faciais e gesticulação do avatar com base no áudio.
 - **Eleven Labs:** Geração de voz realista com entonação humana e sotaque adequado.
 - **CapCut:** Pós-produção — aceleração leve da velocidade da fala (para retirar a cadência arrastada/robótica comum da IA), cortes finos de silêncio e adição de ruído de fundo/tráfego sonoro ambiente para gerar imersão e naturalidade.

2. **Truque de Download sem Marca d'Água (DevTools / Network):**
 - Na versão gratuita web do DreamFace, para não pagar pelo plano Pro nem ficar com marca d'água no criativo: abrir as ferramentas de desenvolvedor do navegador (`Inspecionar Elemento` / `F12` / `Ctrl+P`), acessar a aba **Network (Rede)**, filtrar por mídia/stream (`media` ou formato de vídeo mp4/webm) durante o preview e capturar/baixar a URL direta do arquivo de vídeo limpo sem a logo sobreposta.

3. **Ancoragem de Gestos na Primeira Frame (Evitar Distorções no Lip-Sync):**
 - Para avatares com gesticulação específica (ex: mãos no volante do carro, segurando copo/xícara ou segurando o celular), o gesto e a postura corporal **precisam estar presentes e definidos na primeira frame gerada**. Se o avatar iniciar neutro e tentar gesticular no meio da fala, a IA gera distorções laterais na face e quebra o encaixe do lip-sync.

4. **Técnica de Continuação para Vídeos Longos (Frame-to-Frame Continuity):**
 - **O problema:** Limite de tempo de geração por clipe na IA gratuita (ex: 30s) e perda de consistência visual ao gerar múltiplos trechos soltos.
 - **A solução:** Salvar um print/export exato do **último frame** do vídeo anterior e usá-lo como **imagem inicial / imagem de referência** da próxima geração mantendo exatamente o mesmo prompt base. Isso conecta as cenas perfeitamente sem cortes bruscos, mantendo o avatar consistente e evitando que ele "reinicie" com gestos ou posições erradas.

5. **Prompt Base Operacional da Aula (Prompt Estruturado em Inglês):**

```text
Generate a realistic vertical selfie video format. The character should speak naturally with perfect lip-sync to the audio. Capture an authentic, informal vibe with subtle hand tremors typical of holding a smartphone. Include natural micro-expressions, soft blinking, light head nods, and organic hand gestures emphasizing words. The mood should feel candid, friendly, and spontaneous. Background is a warm, softly lit everyday setting (like a living room or cozy cafe) remaining static with soft depth of field. Ultra-photorealistic 8k video quality.
```
