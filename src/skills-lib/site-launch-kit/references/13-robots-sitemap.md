# Rodada 13 · robots.txt e sitemap

**Garante:** buscadores entram, e entram só onde devem.
**Rode quando:** antes do deploy final, com as rotas de produção já estáveis.

Você é um especialista em SEO técnico com acesso ao repositório deste site. Sua única tarefa nesta rodada: garantir que os buscadores consigam entrar, e que entrem só onde devem.

Antes de editar, detecte: framework, se há geração nativa de robots e sitemap, qual é o domínio de produção e se existe alguma configuração herdada de ambiente de teste.

1. A CONFERÊNCIA QUE VEM PRIMEIRO
   Procure, em TODO o projeto, qualquer bloqueio global de indexação:
   - "Disallow: /" em robots.txt;
   - meta robots noindex no layout, no head global ou em componente compartilhado;
   - cabeçalho HTTP X-Robots-Tag: noindex em configuração de servidor, de host ou de middleware;
   - variável de ambiente de "site privado" ligada em produção.
   Este é o achado mais caro do kit inteiro: bloqueio de staging que sobe no deploy tira o site da busca inteira sem dar erro nenhum. Se encontrar, corrija e marque como CRÍTICO no relatório.

2. ROBOTS.TXT
   Gerado pelo mecanismo do framework quando houver, para não virar arquivo estático esquecido. Deve conter:
   - permissão geral de rastreio;
   - bloqueio apenas do que não é conteúdo (área logada, painel, rotas de API, busca interna com parâmetro, carrinho);
   - a linha Sitemap: com a URL absoluta do sitemap.
   Não use robots.txt para esconder página sensível: o arquivo é público e vira lista de sugestões. O que precisa ficar fora da busca leva noindex; o que precisa ficar fora do ar leva autenticação.

3. SITEMAP.XML
   Gerado a partir das rotas reais, contendo apenas URLs que devolvem 200, são canônicas e são indexáveis. Ficam de fora: página de obrigado, páginas com noindex, redirecionamentos, rotas de sistema. lastmod com data real de modificação do conteúdo. Se o site tiver muitas páginas dinâmicas, gere a partir da fonte de conteúdo.

4. COERÊNCIA
   Cruze as três listas: rotas existentes, sitemap e diretivas de indexação. Nenhuma URL pode estar no sitemap e bloqueada ao mesmo tempo. Confira também canonical e a convenção de barra final.

5. DEPOIS DO DEPLOY
   Escreva o passo a passo curto: verificar o domínio no Search Console, enviar o sitemap, e usar a inspeção de URL na home para confirmar que ela é indexável.

Formato de saída: depois de aplicar, o conteúdo final de robots.txt em bloco de código, e uma tabela markdown:

| Rota | No sitemap? | Indexável? | Coerente? |

Em seguida, ACHADOS CRÍTICOS (se houver bloqueio herdado), PENDÊNCIAS e o passo a passo pós-deploy.

REGRA DE CORTE: se você não tiver certeza de que uma rota deve ser indexada, deixe-a fora do sitemap e liste em PENDÊNCIAS. Sitemap é uma recomendação de prioridade, não um inventário de tudo que existe.
