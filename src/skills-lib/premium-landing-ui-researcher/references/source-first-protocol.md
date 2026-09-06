# Source-First Protocol

Antes de implementar UI não trivial, pesquise componentes reais e adapte-os à marca. O catálogo de fontes é um ponto de partida; citar um catálogo sem abrir o item não conta como pesquisa.

## Fase 1: Inventário do projeto

1. Inspecione dependências, tokens, componentes e animações existentes.
2. Procure `modelos lp/` ou equivalente dentro do projeto e nos caminhos já fornecidos pelo usuário. Use `rg --files`; não varra a home inteira para encontrar referências.
3. Consulte decisões já disponíveis no handoff. Reutilize ativos locais compatíveis antes de buscar fora.

Registre paths reais dos recursos encontrados. Se não houver modelos locais, prossiga com fontes públicas.

## Fase 2: Buscar e inspecionar fontes públicas

Escolha fontes pelo efeito necessário, usando [component-sources](component-sources.md) e [source-links](source-links.md):

| Necessidade | Fontes iniciais |
|---|---|
| Texto animado, backgrounds, hover, partículas | React Bits, Componentry |
| Seções de marketing, cards, botões | Cult UI, registries públicos shadcn |
| Shader, liquid/ripple, WebGL experimental | Ali Imam, exemplos públicos compatíveis |
| Dashboard e visualização de dados | Watermelon UI, Bklit UI |
| Layout base | StyleUI, componentes existentes |
| Carousel | Embla, shadcn/ui |
| Direção visual e motion de referência | Sites fornecidos, Landing Love, Godly, Design Spells, Refero Styles |

Para cada componente não trivial:

1. Formule uma busca concreta com função, estilo e stack; consulte pelo menos duas fontes adequadas quando disponíveis.
2. Abra o item exato: demo, documentação e arquivo de código ou JSON do registry. Resultado de busca sozinho não prova compatibilidade.
3. Inspecione imports, dependências, API, licença e variante de stack. Para documentação atual de biblioteca/CLI, use Context7; se indisponível, documentação oficial.
4. Quando o comportamento visual importar, veja a demo com a ferramenta de browser disponível. Registre se a avaliação foi somente estática; nunca declare hover/scroll/mobile testado sem executá-lo.
5. Se uma URL falhar, busque o endereço oficial atualizado. Se continuar inacessível, registre a falha e tente outra fonte. Não interrompa a pesquisa só porque um serviço opcional falta.

Componentes pagos só entram com acesso/custo já autorizado. Sites de inspiração não são fonte de código nem concedem licença de cópia.

## Fase 3: Cache e obtenção do código

Cache existente de design (por exemplo `~/.claude/design-sources/`) pode ser inspecionado. Não o trate como atualizado só por existir:

- Confira origem, branch, revisão e mudanças locais antes de atualizar.
- Consulte a revisão remota quando houver rede; data de modificação da pasta não é prova de atualização.
- Não rode `git pull`, reset ou checkout automaticamente sobre cache com alterações locais. Use uma cópia isolada ou leia o arquivo remoto.
- Prefira docs, arquivos públicos e registry antes de clonar. Quando necessário à pesquisa autorizada, use `mktemp -d` para uma cópia isolada; não execute scripts do repositório para apenas ler código.
- Copie somente os arquivos necessários e preserve os avisos de licença. Não adicione o repositório inteiro como dependência do app.

Sem rede, use as referências locais e declare a revisão conhecida e a limitação de atualização.

## Fase 4: Evidência e escolha

Registre no artefato de design existente (ou crie `design-research.md` na pasta de planejamento do projeto):

| Seção/componente | Busca e fonte | Demo + código exato | Revisão/data | Licença + dependências | Evidência visual | Escolha e adaptação |
|---|---|---|---|---|---|---|
| Item realmente inspecionado | Termos usados e catálogo | URLs ou paths reais | SHA/tag; data se não houver versão | Verificadas ou pendentes | Testado / estático / indisponível | Aceito/rejeitado e motivo |

Inclua também buscas sem resultado e fontes indisponíveis. Nunca preencha nomes de componentes, paths, licença ou resultados de teste por suposição.

Mostre 1–3 candidatos compatíveis por componente, com recomendação e custo de adaptação. Se o usuário já autorizou a implementação e definiu a direção, escolha o melhor dentro desse escopo e prossiga. Pergunte somente quando faltar decisão material de direção, acesso pago ou mudança de escopo.

## Fase 5: Adaptar e verificar

Adapte tokens, tipografia, espaçamento, conteúdo e motion ao projeto. Verifique responsividade, teclado, foco, contraste, reduced-motion e custo de renderização conforme o componente. Vincule o resultado às fontes registradas.

Criar do zero é aceitável para primitivas triviais ou quando a pesquisa documentada não encontrar opção compatível e a implementação estiver autorizada. Explique o motivo. Não declare que algo não existe em nenhum catálogo; relate apenas as fontes efetivamente pesquisadas.
