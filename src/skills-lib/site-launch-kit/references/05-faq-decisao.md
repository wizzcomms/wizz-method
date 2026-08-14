# Rodada 05 · FAQ de decisão com dados estruturados

**Garante:** cinco perguntas que resolvem dúvida de decisão, marcadas com FAQPage.
**Rode quando:** por último, depois de CTAs, barra mobile, prazos de resposta e prova social estarem fechados.

Você é responsável pelas objeções deste site, com acesso ao repositório. Sua única tarefa nesta rodada: publicar cinco perguntas frequentes que resolvam dúvida de decisão, e marcá-las com dados estruturados.

Antes de escrever, leia o site inteiro e liste o que ele JÁ responde. Sua matéria-prima é essa; o que não estiver lá, você pergunta.

NÃO invente preço, prazo, política de reembolso, área de cobertura ou condição comercial. Esses são exatamente os campos que o visitante vai cobrar depois.

1. ESCOLHA AS CINCO
   Priorize, nesta ordem, a pergunta que trava a decisão:
   - quanto custa (ou como o preço é formado, se não houver tabela);
   - quanto tempo demora;
   - como funciona, passo a passo, do primeiro contato à entrega;
   - para quem NÃO serve, ou o que não está incluso;
   - o que acontece se der errado (garantia, suporte, revisão).
   Adapte ao negócio, mas mantenha o critério: pergunta desconfortável entra, pergunta institucional ("quem somos?", "qual nossa missão?") fica de fora. Se o repositório tiver histórico de atendimento, chat ou e-mails, use a frequência real das perguntas em vez do seu palpite.

2. ESCREVA AS RESPOSTAS
   - Comece pela resposta, não pelo contexto. Primeira linha resolve.
   - Duas a quatro frases. Resposta longa é resposta que ninguém lê.
   - Sem "depende": diga de que depende e dê a faixa.
   - Sem eufemismo: se o serviço não atende certa região ou porte, diga.
   - Cada resposta que dependa de informação que você não tem vira placeholder explícito ({{PRAZO}}, {{FAIXA_DE_PRECO}}) e entra em PENDÊNCIAS. Nunca preencha por estimativa.

3. IMPLEMENTE
   - Acordeão acessível: <details>/<summary> ou botão com aria-expanded e aria-controls; navegável por teclado; a resposta precisa estar no HTML mesmo fechada, senão o Google não lê.
   - JSON-LD de FAQPage com exatamente as mesmas perguntas e respostas que estão na tela. Divergir entre marcação e conteúdo visível é violação de diretriz e derruba o rich result.
   - Ao final da seção, o CTA principal do site: quem chegou até aqui está decidindo.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| # | Pergunta | Fonte da resposta | Objeção que derruba |

Em seguida, PENDÊNCIAS, uma linha por item no formato "o que falta · de quem obter · o que ele destrava". Liste também as perguntas que você considerou e descartou, com o motivo em três palavras.

REGRA DE CORTE: cinco perguntas que doem valem mais que doze que enfeitam. Se só houver material honesto para três, publique três.
