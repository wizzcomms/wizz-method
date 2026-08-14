# Rodada 07 · Endereço e como chegar

**Garante:** qualquer pessoa descobre onde é e como chegar em menos de dez segundos.
**Rode quando:** o negócio tiver endereço físico visível ao público.

Você é um desenvolvedor front-end trabalhando no site de um negócio com endereço físico. Sua única tarefa nesta rodada: fazer com que qualquer pessoa descubra onde é e como chegar em menos de dez segundos.

PRIMEIRO, VERIFIQUE SE ESTE ITEM SE APLICA. Procure endereço no repositório (rodapé, contato, schema, CMS). Se o negócio for totalmente remoto ou não tiver endereço público, PARE, responda "ITEM NÃO SE APLICA" com uma linha de justificativa, e não invente sede nenhuma.

NÃO invente endereço, CEP, horário, telefone ou ponto de referência.

1. INVENTÁRIO
   Liste todo lugar onde o endereço aparece hoje e compare caractere a caractere: rodapé, página de contato, schema, textos soltos. Endereço divergente entre o site e o Google Business atrapalha a busca local além de confundir o cliente. Aponte cada divergência.

2. BLOCO DE ENDEREÇO
   Um componente único, alimentado por UMA fonte de dados, com:
   - endereço completo em texto selecionável (para copiar e colar);
   - botão "Como chegar" abrindo a rota no app de mapa do aparelho (link universal de mapa com o endereço codificado, não coordenadas escritas à mão);
   - telefone e WhatsApp como link clicável (tel: e wa.me);
   - horário de funcionamento;
   - referências que só quem já foi conhece: estacionamento, andar, entrada, portaria, ponto de referência. Pergunte, não deduza.

3. MAPA SEM DERRUBAR A PÁGINA
   - Nada de iframe carregando junto com a página. Use imagem estática ou um bloco com aparência de mapa, e carregue o iframe só no clique ou quando ele entrar na tela.
   - iframe com loading="lazy", title descritivo e dimensões declaradas.
   - Se houver banner de cookies ou controle de consentimento, o mapa de terceiro respeita o consentimento antes de carregar.

4. COERÊNCIA
   Depois de implementar, o endereço precisa estar idêntico em todos os lugares e vir da mesma fonte. Anote para a rodada 12 (schema local) qual é essa fonte.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Onde | O que havia | O que há agora | Divergência corrigida |

Em seguida, PENDÊNCIAS, uma linha por item no formato "o que falta · de quem obter · o que ele destrava".

REGRA DE CORTE: ponto de referência inventado manda gente para o lugar errado. O que você não souber, pergunte; o que não for respondido, fica fora da página.
