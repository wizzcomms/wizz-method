# Rodada 15 · Medição de lançamento

**Garante:** cada ação que vale dinheiro registrada com nome que faz sentido daqui a três meses.
**Rode quando:** na véspera ou no dia do lançamento, com os pontos de contato finais no site.

Você é responsável pela medição deste site. Sua única tarefa nesta rodada: garantir que, no dia do lançamento, cada ação que vale dinheiro seja registrada com um nome que faça sentido daqui a três meses.

Antes de editar, detecte: framework, se já existe alguma ferramenta de medição instalada (analytics, pixel, tag manager), se há banner de consentimento e quais são os pontos de contato do site.

NÃO instale quatro ferramentas. NÃO envie dado pessoal como parâmetro de evento (nome, e-mail, telefone, CPF). NÃO invente conta nem identificador de medição: sem o identificador, deixe a variável de ambiente declarada e registre em PENDÊNCIAS.

1. LEVANTAMENTO
   Liste o que já está instalado e o que cada coisa mede hoje. Duplicação é comum: analytics carregado duas vezes conta cada visita em dobro. Liste também todo ponto de contato: formulários, WhatsApp, telefone, e-mail, download, agendamento, CTA principal e o da barra fixa.

2. NOMENCLATURA (faça isto antes de escrever código)
   Defina o padrão e escreva-o em um arquivo de documentação do projeto: objeto_ação em minúsculas com sublinhado (formulario_enviado, whatsapp_clique, telefone_clique, orcamento_iniciado). Parâmetros úteis: origem do clique (herói, barra fixa, rodapé), página e identificador do formulário. Nada de dado pessoal. Uma constante por evento, em um arquivo só: nome de evento digitado à mão em cada componente diverge em uma semana.

3. IMPLEMENTAÇÃO
   - Script carregado sem travar a renderização.
   - Nada dispara antes do consentimento, se houver banner.
   - Anonimização de IP quando a ferramenta permitir.
   - Um disparo por ação, protegido contra clique duplo e contra recarregamento da página de obrigado.
   - Página de obrigado como conversão principal, ligada à rodada 03 (tempo de resposta).
   - Se houver pixel de anúncio, dispare o mesmo evento nele, com o mesmo nome, para os relatórios baterem.

4. TESTE DE FUMAÇA
   Em ambiente local ou de teste, execute cada ação e confirme o evento no depurador da ferramenta. Um evento não testado é um evento que não existe. Liste o que você conseguiu confirmar e o que ficou pendente.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Evento | Gatilho (arquivo · elemento) | Parâmetros | Testado? |

Em seguida, PENDÊNCIAS (identificadores de conta, acessos, eventos não testados) e o padrão de nomenclatura em bloco de código, pronto para entrar na documentação do projeto.

REGRA DE CORTE: meça poucas coisas e meça direito. Vinte eventos mal nomeados produzem um painel que ninguém abre; quatro eventos certos respondem à única pergunta que importa, que é de onde veio o cliente.
