# Passo 08 · Fusão e Priorização

Recebe as 7 tabelas das áreas (01 a 07) e funde num diagnóstico único. Não é uma nova rodada de investigação: é organização do que já foi levantado.

## Como fundir

1. **Cole as 7 tabelas** (ou as que rodaram, se alguma foi marcada `ITEM NÃO SE APLICA`).
2. **Dedup por origem cruzada.** O mesmo problema pode aparecer em duas áreas (ex.: domínio apontando pro ambiente errado aparece na área 03 e na área 07). Mantenha uma linha só, citando as duas áreas de origem.
3. **Ordene por severidade primeiro** (🔴 no topo, 🟢 no fim), e dentro da mesma severidade, pelo esforço estimado de correção (menor esforço primeiro): resolve mais rápido o que está mais perto do go-live.
4. **Agrupe por executor.** Vários achados 🔴 que vão pro mesmo executor (ex.: 3 achados de `site-launch-kit`) formam um bloco só na entrega, pra virar um único despacho.
5. **Conte pendências separadamente.** PENDÊNCIA DE VERIFICAÇÃO MANUAL não é severidade: é "não dá pra saber ainda". Liste à parte, com o que falta pra virar um veredito real.

## Tabela final

```
| # | Área | Item | Severidade | Executor | Esforço estimado |
```

Seguida de:

**Bloqueantes de hoje (🔴):** lista curta, só o que impede literalmente o go-live. Se a lista tiver mais de 5 itens, isso já é sinal pro dono do projeto de que o lançamento provavelmente precisa adiar, diga isso explicitamente.

**Recomendação:** uma de três, nunca decidida pela skill sozinha, é leitura dos números:

- **GO:** zero 🔴, poucos 🟠 documentados como aceitáveis pelo dono do projeto.
- **GO COM RESSALVAS:** 🔴 zero, mas 🟠 relevante o suficiente pra avisar explicitamente antes do dono decidir.
- **NO-GO:** qualquer 🔴 aberto.

A recomendação é uma leitura objetiva da tabela (contagem de severidade), não um palpite. Explique o critério usado (ex.: "NO-GO porque há 2 achados 🔴 abertos: X e Y") em vez de só declarar o rótulo.

## Regra de corte

Não amenize a contagem pra chegar num "GO" mais confortável. Se há 🔴 aberto, a recomendação é NO-GO, mesmo que o prazo de lançamento esteja apertado: apertar o prazo é decisão do dono do projeto, não da skill.
