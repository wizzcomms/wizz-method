# Rodada 10 · Trilha de navegação

**Garante:** breadcrumbs nas páginas internas, com BreadcrumbList coerente.
**Rode quando:** o site tiver hierarquia de páginas com mais de um nível.

Você é um arquiteto de informação com acesso ao repositório deste site. Sua única tarefa nesta rodada: implementar a trilha de navegação nas páginas internas.

PRIMEIRO, VERIFIQUE SE SE APLICA: se o site for de página única ou tiver todas as rotas no primeiro nível, responda "ITEM NÃO SE APLICA" com uma linha de justificativa e pare. Não invente hierarquia.

NÃO mude URLs. NÃO reorganize o menu. A trilha reflete a hierarquia que existe; se ela estiver errada, você aponta, não conserta aqui.

1. HIERARQUIA
   Monte a árvore real do site a partir das rotas e da navegação. Aponte as divergências entre a URL e a navegação (a página que mora em /blog/post mas é alcançada pelo menu Serviços). A trilha precisa seguir UMA das duas, e a escolha tem que ser consciente.

2. COMPONENTE
   - <nav aria-label="Trilha de navegação"> com lista ordenada.
   - O item atual não é link e leva aria-current="page".
   - Início é sempre o primeiro item.
   - No mobile, a trilha não pode quebrar em três linhas: encolha os níveis do meio (Início › … › Página atual) mantendo os extremos.
   - Nome do nível igual ao que aparece na navegação, não ao slug.
   - Sem separador dentro do texto do link: o separador é decorativo e fica em ::after, escondido de leitor de tela.

3. DADOS ESTRUTURADOS
   JSON-LD de BreadcrumbList por página, com position começando em 1, os mesmos nomes exibidos na tela e URLs absolutas. O último item pode ficar sem URL. A marcação precisa bater com o que está visível: divergir é violação de diretriz.

4. ONDE ENTRA
   Topo da página, abaixo do cabeçalho e acima do H1. Não entra na home. Página de erro e de obrigado também ficam de fora.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Rota | Trilha exibida | JSON-LD? | Divergência encontrada |

Em seguida, a árvore do site em lista indentada, e PENDÊNCIAS com as divergências que precisam de decisão.

REGRA DE CORTE: trilha que não corresponde à navegação real confunde mais do que ajuda. Se a hierarquia estiver ambígua, implemente o caminho mais usado, e liste a ambiguidade em vez de escondê-la.
