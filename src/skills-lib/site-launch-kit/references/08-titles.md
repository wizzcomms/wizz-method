# Rodada 08 · Title próprio por página

**Garante:** cada página com title próprio, descritivo e único.
**Rode quando:** o site tiver mais de uma rota pública.

Você é um especialista em SEO técnico com acesso ao repositório deste site. Sua única tarefa nesta rodada: garantir que cada página tenha um title próprio, descritivo e único.

Antes de editar, detecte o terreno: framework e roteamento, onde os metadados são definidos (metadata do Next, react-helmet, tags no HTML, CMS) e se existe um title herdado do layout.

NÃO mude conteúdo de página, H1 ou URL. Esta rodada é só de title.

1. LEVANTE
   Enumere TODA rota pública, inclusive páginas dinâmicas (produto, post, serviço) e as que só existem no build. Para cada uma, registre o title atual. Marque:
   - vazio ou ausente;
   - repetido em duas ou mais rotas;
   - genérico ("Home", "Página inicial", "Untitled", nome do framework);
   - herdado do layout sem sobrescrita;
   - acima de 60 caracteres (será cortado no resultado de busca) ou abaixo de 20 (está desperdiçando espaço).

2. ESCREVA OS NOVOS
   Padrão: [o que a pessoa procura] + [diferencial ou lugar] + [marca].
   - A palavra que a pessoa digita vem no começo, não no fim.
   - Entre 50 e 60 caracteres, contando os separadores.
   - Marca por último, só se couber; na home, a marca pode vir primeiro.
   - Sem enfeite: "|", "-" ou "·" como separador, e só um deles.
   - Sem repetir a mesma palavra três vezes.
   - Negócio local: inclua a cidade quando ela fizer parte da busca.
   Para rota dinâmica, escreva o template e mostre dois exemplos reais renderizados, com a contagem de caracteres de cada um.

3. IMPLEMENTE
   Um lugar só define o title de cada página, no mecanismo nativo do framework. Se houver título padrão de layout, ele fica apenas como rede de segurança, e toda página passa a sobrescrevê-lo. Página de obrigado, área logada e páginas de erro também recebem title próprio.

4. CONFIRA
   Rode o build e liste os titles renderizados. Nenhum repetido, nenhum vazio, nenhum acima de 60 caracteres.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Rota | Title antes | Title agora | Caracteres | Problema resolvido |

Em seguida, PENDÊNCIAS com as páginas cujo título depende de decisão de posicionamento (qual palavra priorizar), uma linha por item.

REGRA DE CORTE: título que promete o que a página não entrega gera clique e abandono, e isso é pior do que não ser clicado. Descreva a página que existe, não a que você gostaria que existisse.
