# Modo Auditoria 360°

**Gatilho:** "análise geral", "auditoria completa", "revisa tudo", "audita todas as áreas", "360", "/wizz-router auditoria".

Ao detectar o gatilho, apresente o menu de áreas via `AskUserQuestion`:

```
Vou fazer uma Auditoria 360° do projeto. Escolha as áreas:

[ ] 🔧 Código e Arquitetura — code-reviewer + architect
[ ] 🔒 Segurança — web-security + security-reviewer + auth-and-secrets
[ ] 🗄️ Banco de Dados — database-reviewer + database-and-deps
[ ] 🎨 Design e UX — ui-ux-pro-max + premium-landing (Audit Passes)
[ ] 📈 Growth e SEO — seo-audit + page-cro + analytics-tracking
[ ] ⚡ Performance — database-scaling + caching-and-queues + infrastructure
[ ] 🧠 Contexto e Decisões — cerebro (aprendizados registrados)

[ ] Selecionar todas as áreas
```

Após confirmação, dispare as skills selecionadas em paralelo (subagentes independentes) quando possível. Consolide num relatório final por área, com achados classificados por severidade e ações priorizadas por impacto × esforço.
