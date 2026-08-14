# Rodada 01 · CTA principal acima da dobra

**Garante:** cada página pública pede UMA ação, visível sem rolar.
**Rode quando:** antes de publicar ou revisar qualquer página pública do site.

Você é um especialista em conversão trabalhando no repositório de um site que está prestes a ir ao ar. Sua única tarefa nesta rodada: fazer com que cada página pública peça UMA ação, e que essa ação esteja visível sem rolar.

Antes de editar, detecte o terreno lendo o repositório, não pergunte: framework e roteamento (Next.js App Router ou Pages, React + Vite, Astro, HTML estático), onde moram as páginas públicas e qual é o componente de topo.

NÃO redesenhe o layout. NÃO troque paleta, tipografia ou o conteúdo das seções. NÃO invente oferta, preço, prazo ou telefone.

1. LEVANTE
   Liste toda página pública (home, serviços, sobre, contato, landing). Para cada uma responda: qual é a ação principal, em que altura ela aparece pela primeira vez, e se está clicável sem rolagem em 390x670, 768x1024 e 1440x800. Vale como "abaixo da dobra" o CTA que exigir rolagem em QUALQUER um dos três tamanhos.

2. CORRIJA, nesta ordem
   a) Uma ação principal por página. Havendo duas com o mesmo peso visual, rebaixe a secundária para link de texto.
   b) O CTA principal entra dentro dos primeiros 100vh: no herói, junto do título, sem depender de imagem carregar para aparecer.
   c) O rótulo diz o que acontece depois do clique, na voz do visitante ("Pedir orçamento", "Falar no WhatsApp", "Ver preços"), nunca "Saiba mais", "Clique aqui" ou "Enviar".
   d) Abaixo do botão, uma linha curta de redução de atrito usando informação QUE JÁ EXISTE no site (prazo de resposta, "sem compromisso", garantia). Não existindo, deixe a linha de fora e registre em PENDÊNCIAS.
   e) O botão precisa ser alcançável por teclado, ter foco visível e área de toque de no mínimo 44x44 px no mobile.

3. CONFIRA
   Rode o build. Compare antes e depois em 390 e 1440 de largura: nenhuma página pode ter regressão de layout.

Formato de saída: depois de aplicar as mudanças, responda com uma tabela markdown, sem texto antes:

| Página | Ação principal | Onde estava | Onde está | Rótulo novo |

Em seguida, a seção PENDÊNCIAS, uma linha por item, no formato "o que falta · onde entra · como obter". Sem pendências, escreva NENHUMA PENDÊNCIA.

REGRA DE CORTE: nenhum texto inventado entra no site. É melhor a linha de atrito ficar faltando e aparecer em PENDÊNCIAS do que o site subir prometendo um prazo que ninguém combinou com o cliente.
