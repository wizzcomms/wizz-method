## 15. Como estender esta base

> Shard da metodologia low ticket. Índice: [`INDEX.md`](INDEX.md) · Sempre carregado junto: [`guardrails.md`](guardrails.md)
> Este shard é sobre manutenção da base, não sobre tráfego. Só é lido quando o pedido é "processei material novo".

Esta base é uma **destilação**. O material bruto (aula, PDF, transcrição, prompt de terceiro) fica fora daqui: fora do pacote, fora do git, na máquina de quem processou. O que entra é fato, número, checklist e análise, escritos do zero.

### A regra que não se quebra

**Escreva o fato, nunca a frase.** Se o texto que você está prestes a colar é a expressão de outra pessoa (transcrição, trecho de PDF, prompt comprado), ele não entra. O que entra é o que aquilo *afirma*, na sua redação, com o número preservado.

Isso não é só cautela jurídica. Um shard de 120 linhas bem estruturado é mais útil para um agente do que um prompt de 982 linhas colado inteiro, porque o agente carrega o shard e não carrega o prompt.

### O processo, em 7 passos

1. **Ler a fonte inteira** antes de escrever qualquer coisa.
2. **Separar** o que é fato/número/regra (entra) do que é expressão/exemplo autoral/anedota (fica de fora).
3. **Achar o shard de destino** pelo INDEX. Um assunto novo só vira shard novo quando não cabe em nenhum.
4. **Escrever no shard**, na sua redação, mantendo os números exatos.
5. **Registrar a contradição**, se o material novo brigar com o que já está escrito: vai para [`pontos-em-aberto.md`](pontos-em-aberto.md) numerado, não some e não é resolvido por conta própria.
6. **Registrar o risco**, se a tática violar termo de plataforma ou lei do consumidor: vai para [`guardrails.md`](guardrails.md), que é carregado sempre, e ganha uma linha de bloqueio inline no shard.
7. **Medir o tamanho.** Shard acima de ~200 linhas ficou caro para o degrau 1 e pede corte. Foi assim que os shards 4 e 12 viraram três arquivos cada.

### Ao criar um shard novo

- Nome: `NN-tema.md` em minúsculas, sem acento, com o número da seção de origem.
- Cabeçalho: título `## NN. Tema`, o bloco de citação padrão (índice + guardrails + precedência) e uma linha `**O que tem aqui:**` listando as subseções.
- Linha nova no INDEX com o **gatilho** (as palavras que a pessoa usaria) e o **conteúdo em uma frase**. Sem isso o shard existe e nunca é encontrado.
- Se o shard tiver irmãos (`04`, `04a`, `04b`), cada um aponta para os outros no cabeçalho.

### O que não fazer

- Não abrir dois shards para descobrir qual era. Se o INDEX não resolveu, o problema é a linha do INDEX; conserte-a.
- Não duplicar o mesmo fato em dois shards. O segundo lugar guarda um ponteiro (`ver §7.4`), não uma cópia.
- Não deixar contradição implícita. Duas frases que brigam em shards diferentes custam mais caro do que um ponto em aberto declarado.
