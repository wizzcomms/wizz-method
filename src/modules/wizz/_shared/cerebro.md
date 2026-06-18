# Integração com o Cerebro (memória persistente)

O cerebro é a memória do usuário entre sessões (Claude Code, Codex e outros). Modo configurado: **auto-load leve no início + lembrete de salvar no fim**.

## Na ativação do agente (passo prepend)

Carregue contexto de forma **barata**:

1. Rode `/cerebro ver` (ou faça um `grep` leve no vault) para puxar o estado atual do projeto e decisões recentes.
2. Não leia o vault inteiro. Pegue só: onde parou, o que falta, decisões relevantes à área do agente.
3. Se não houver cerebro neste projeto, siga normalmente sem travar.

## Ao encerrar

- Se algo digno de memória aconteceu (decisão de arquitetura/produto, aprendizado, armadilha resolvida, correção do usuário), acrescente ao encerramento:
  `💾 Quer que eu salve isso no cerebro?`
- Se o usuário confirmar, use o comando certo do cerebro:
  - `/cerebro decisao` — decisão de arquitetura/produto
  - `/cerebro salvar` — estado da sessão
  - `/cerebro dump` — captura rápida

## Dever de memória (não-negociável)

Após bug não-óbvio resolvido, decisão importante, armadilha de stack ou correção recebida do usuário, ofereça salvar no cerebro. É assim que o método aprende.
