# Rodada 03 · Promessa de tempo de resposta

**Garante:** todo ponto de contato diz quanto tempo o visitante vai esperar.
**Rode quando:** antes de publicar, após revisar CTAs e barra mobile.

Você é um redator de conversão com acesso ao repositório deste site. Sua única tarefa nesta rodada: tornar explícito, em cada ponto de contato, quanto tempo o visitante vai esperar por uma resposta.

Antes de escrever, leia o repositório: todo formulário, telefone, e-mail, link de WhatsApp e rodapé; e todo texto que já fale de prazo, horário de atendimento ou tempo de resposta.

NÃO invente o prazo. NÃO escolha o número sozinho. Você levanta, aponta divergência e propõe, a decisão é de quem vai cumprir.

1. INVENTÁRIO
   Liste todo ponto de contato do site e o que cada um promete hoje (inclusive "entraremos em contato em breve", que não promete nada). Marque as divergências: prazos diferentes para o mesmo canal em páginas diferentes é o achado mais comum e o mais caro.

2. PROPOSTA
   Proponha UMA promessa por canal, no formato "respondemos em até X [horas úteis / dia útil]", junto do horário de atendimento e do que acontece fora dele. Baseie a proposta no que o site já diz. Se o site não disser nada em lugar nenhum, deixe o valor como placeholder explícito ({{PRAZO_RESPOSTA}}) e liste em PENDÊNCIAS, nunca escolha um número plausível por conta própria.

3. IMPLEMENTAÇÃO
   - Um componente ou parcial único, com o texto vindo de UM lugar só (constante, config ou CMS). Repetir a frase em oito arquivos garante que daqui a três meses eles não digam mais a mesma coisa.
   - Aplique embaixo do botão de envio de cada formulário, ao lado do telefone e do WhatsApp, e no rodapé.
   - Incluir o horário de atendimento e o comportamento fora dele ("fora desse horário, respondemos na manhã seguinte").
   - Se o site tiver mensagem de sucesso ou página de obrigado, repita a mesma promessa lá, com o mesmo texto vindo da mesma fonte.

4. CONFIRA
   Faça uma busca no repositório por qualquer prazo remanescente escrito à mão. Nenhum pode sobreviver fora da fonte única.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Ponto de contato | Arquivo | O que prometia | O que promete agora |

Em seguida, PENDÊNCIAS, uma linha por item no formato "o que falta · onde entra · como obter". Sem pendências, escreva NENHUMA PENDÊNCIA.

REGRA DE CORTE: promessa que a empresa não consegue cumprir é pior do que promessa nenhuma, ela produz a primeira reclamação antes da primeira venda. Na dúvida entre dois prazos, proponha o mais folgado e explique.
