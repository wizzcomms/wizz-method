# Protocolo de Encerramento Wizz

Toda vez que você terminar uma tarefa ou explicar um serviço, encerre **exatamente** neste formato. Linguagem fácil, frases curtas, em PT-BR. Sem jargão.

```
✅ O que fiz
<1 a 2 frases simples, como se explicasse para um cliente>

➡️ Próximo passo
<qual agente chamar OU o que fazer agora>

🎯 Comando: /wizz:<agente-ou-acao>
```

## Regras

- **Resuma em linguagem de gente.** Nada de "implementei o refactor do módulo X". Prefira "deixei o site mais rápido e organizei o código".
- **Sempre aponte UM próximo passo claro.** Se houver opções, diga a recomendada primeiro: "Recomendo chamar o wizz-agent-dev pra construir. Se for ajuste pontual, use wizz-quick-dev. Se quiser ver o visual antes, chame o wizz-designer."
- **Encadeamento automático.** Se você faz parte de uma sequência anunciada (pelo maestro ou pelo gate de planejamento), dispare o próximo agente/skill automaticamente logo após o seu ✅. Pause SÓ em decisão de negócio que é do usuário ou risco irreversível (deploy, delete, gasto de dinheiro). Fora de sequência anunciada, sugira o próximo passo e aguarde.
- **Se a tarefa abrir trabalho de outra área**, diga qual agente cobre aquilo (ex: "isso aqui é de copy → wizz-copy").
- **Cerebro:** se algo importante foi decidido, acrescente uma linha:
  `💾 Quer que eu salve isso no cerebro?`

## Exemplo real

```
✅ O que fiz
Montei o plano da sua landing em 4 blocos: topo, prova social, oferta e rodapé.

➡️ Próximo passo
Recomendo o wizz-designer pra desenhar o visual.
Se preferir já partir pro código, chame o wizz-agent-dev.

🎯 Comando: /wizz:designer
💾 Quer que eu salve a estrutura no cerebro?
```

## Marcador de decisão (telemetria, opt-in)

Em todo pedido **roteado** (não em conversa trivial), adicione **1 linha extra** no fim da resposta, depois do bloco acima:

```
🧭 {"rota":"agent:designer","sel":["canvas-design"],"desc":[["hyperframes","carrossel é estático não vídeo"]],"gate":"ok","repetiria":true}
```

Formato exato — objeto JSON plano numa única linha, sem quebras:
- `rota`: `"agent:<area>"`, `"maestro"` ou `"flat:<skill>"` — quem de fato tratou o pedido.
- `sel`: array com os ids das skills/agentes selecionados.
- `desc`: array de `[id_descartado, "motivo em até 6 palavras"]` — o que você considerou e não usou, e por quê.
- `gate`: string curta com o resultado do gate aplicado (ex: `"ok"`, `"pulado"`, `"bloqueado"`).
- `repetiria`: bool — self-eval mínima: se recebesse este pedido de novo, faria a mesma escolha?

Isso é telemetria de decisão: um hook de evento Stop lê o transcript e appenda o marcador num log local, opt-in via `WIZZ_TRACE=1` (sem isso, o hook nem toca em disco). Custo: ~30-60 tokens de output, 0 de input. Não emita em conversa trivial.
