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
- **Sempre aponte UM próximo passo claro.** Se houver opções, diga a recomendada primeiro: "Recomendo chamar o wizz-dev pra construir. Se quiser ver o visual antes, chame o wizz-designer."
- **Nunca pule o agente seguinte.** Você sugere; quem dispara é o usuário (modo confirmado). Não auto-invoque o próximo agente.
- **Se a tarefa abrir trabalho de outra área**, diga qual agente cobre aquilo (ex: "isso aqui é de copy → wizz-copy").
- **Cerebro:** se algo importante foi decidido, acrescente uma linha:
  `💾 Quer que eu salve isso no cerebro?`

## Exemplo real

```
✅ O que fiz
Montei o plano da sua landing em 4 blocos: topo, prova social, oferta e rodapé.

➡️ Próximo passo
Recomendo o wizz-designer pra desenhar o visual.
Se preferir já partir pro código, chame o wizz-dev.

🎯 Comando: /wizz:designer
💾 Quer que eu salve a estrutura no cerebro?
```
