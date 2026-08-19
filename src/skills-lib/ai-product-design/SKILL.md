---
name: ai-product-design
description: >
  Design de produtos e agentes de IA: como o agente se comporta, como escrever o prompt/system prompt,
  guardrails e trust/safety, orquestração multi-agente e avaliação. Usar quando: criar ou melhorar um
  agente/assistente/chatbot, escrever ou revisar system prompt, definir persona/tom/voz, montar few-shot,
  chain-of-thought, guardrails, recusas, escalonamento pra humano, handoff entre agentes, detecção de
  frustração, generative UI, ou medir qualidade de saída de IA. Base: Owl-Listener/ai-design-skills (MIT).
  44 padrões em 6 categorias, cada um detalhado em references/. Use quando o pedido mencionar system
  prompt, persona de agente, guardrails, orquestração multi-agente, handoff entre agentes ou avaliação
  de qualidade de IA.
---

# AI Product Design — 44 padrões

Biblioteca de padrões pra desenhar **como uma IA/agente se comporta** e **como o prompt dele é escrito**.
Cada item abaixo tem o texto completo em `references/<categoria>/<nome>/SKILL.md`. Este arquivo é o índice:
ache o padrão pela intenção, depois abra a reference pro detalhe.

> Uso no método: é a base pra construir e revisar os próprios agentes do Wizz Method (os 15 `customize.toml`,
> system prompts, guardrails, handoffs). Consulte antes de criar/ajustar qualquer agente ou prompt.

## 1. Comportamento do agente (`references/system-behavior-shaping/`)
Como o agente soa e reage.
- **persona-architecture** — define personagem, voz e traços uma vez, pra não derivar entre sessões
- **tone-calibration** — botões de tom por contexto (formalidade, calor, confiança)
- **emotional-design** — resposta a frustração, confusão, alegria, angústia (valida sem amplificar)
- **error-personality** — como comunicar erro, incerteza e limite com elegância
- **behavioral-consistency** — comportar-se previsível entre sessões, edge cases e modalidades
- **domain-voice** — ajustar o comportamento pra um domínio profissional específico
- **cultural-adaptation** — adaptar a contexto cultural, idioma e normas

## 2. Interação humano-IA (`references/model-interaction-design/`)
Como a conversa flui.
- **conversation-patterns** — turnos, sequências de reparo, checkpoints de alinhamento
- **frustration-detection** — ler frustração por caps, pontuação, repetição, latência e adaptar
- **mixed-initiative-flow** — quando o agente lidera vs. quando o usuário lidera, com handoff limpo
- **progressive-disclosure** — revelar o poder da ferramenta aos poucos, sem afogar no turno 1
- **generative-ui** — quando renderizar um componente (date picker, card, gráfico) vs. texto puro
- **multimodal-orchestration** — sequenciar texto, imagem, voz e uso de tool num fluxo só
- **feedback-loops** — correção do usuário, thumbs, edição inline como sinal que muda o comportamento
- **context-window-design** — orçamento de tokens, memória, resumir vs. buscar, degradação suave

## 3. Arquitetura de prompt (`references/prompt-architecture/`)
Como o prompt é escrito. **A camada mais direta pra melhorar agentes.**
- **system-prompt-structure** — anatomia: identidade, contexto, regras, formato, exemplos (o que importa no começo/fim)
- **constraint-specification** — limites testáveis: formato, tamanho, tom, conteúdo proibido
- **few-shot-patterns** — exemplos que miram os erros que o modelo insiste em cometer
- **chain-of-thought-design** — cadeias de raciocínio deliberadas pra tarefa de vários passos
- **template-design** — templates parametrizados com variáveis nomeadas e seções condicionais
- **context-engineering** — o que entra no contexto e em que ordem
- **prompt-versioning** — versionar prompts, testar mudanças, rastrear o que funciona

## 4. Trust & Safety (`references/ai-alignment-reasoning/`)
O que o agente pode e não pode; como não enganar o usuário.
- **guardrail-design** — limites de comportamento e padrões de recusa explícitos (o "pode/não pode")
- **transparency-patterns** — mostrar o que o modelo sabe, não sabe e o quão certo está
- **trust-calibration** — nem overtrust nem undertrust; sinalizar incerteza em vez de blefar
- **escalation-design** — quando escalar pra humano, recusar, ou pedir esclarecimento
- **harm-anticipation** — mapear failure modes, mau uso e consequências não intencionais
- **value-specification** — traduzir valores da organização em constraints do sistema
- **consent-and-agency** — consentimento informado, opt-out e override humano
- **bias-detection-design** — workflows de review pra achar e mitigar viés

## 5. Orquestração multi-agente (`references/design-agent-orchestration/`)
Pra sistemas com vários agentes (o caso do próprio método: Diretor → maestro → agentes).
- **agent-role-design** — o que cada agente faz, sabe e é dono num sistema multi-agente
- **task-decomposition** — quebrar objetivo complexo em subtarefas que os agentes resolvem
- **handoff-protocols** — transições suaves entre agentes e entre IA e humano
- **state-management** — contexto, memória e estado compartilhados entre agentes
- **human-in-the-loop** — pontos de intervenção onde o humano revisa, aprova ou redireciona
- **failure-recovery** — quando um agente falha: retry, fallback, escalar, degradação suave
- **observability-design** — tornar o workflow multi-agente visível e debugável

## 6. Avaliação (`references/evaluation/`)
Como saber se a IA está boa.
- **output-quality-rubrics** — definir o que é "bom": acurácia, relevância, utilidade
- **task-success-metrics** — medir se a IA de fato ajudou o usuário a concluir a meta
- **user-satisfaction-signals** — ler sinais implícitos/explícitos: edições, regenerações, abandono
- **failure-taxonomy** — classificar falhas: alucinação, recusa, irrelevância, tom errado, latência
- **comparative-evaluation** — A/B, comparação lado a lado, ranking de preferência
- **heuristic-evaluation-ai** — heurísticas de Nielsen adaptadas + heurísticas próprias de IA
- **longitudinal-measurement** — qualidade ao longo do tempo: drift, degradação, melhoria

---

**Créditos:** Owl-Listener/ai-design-skills (licença MIT, ver `references/LICENSE`). Índice traduzido/curado para o Wizz Method.
