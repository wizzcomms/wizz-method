# Handoff prompt para Claude Code / Codex

Carregar ao fechar o plano — o template exato do prompt de handoff para desenvolvimento (Claude Code, Codex, ou dev manual).

## Handoff para Claude Code / Codex

Sempre terminar com um prompt pronto para desenvolvimento.

**Template:**

```
You are a senior frontend engineer.

Build this project using the implementation plan below.

Requirements:
- Follow the defined stack.
- Do not add unnecessary dependencies.
- Respect the motion path.
- If the motion path is image-to-video, do not implement Three.js for the hero.
- If the motion path is 3D real, implement R3F with mobile fallback.
- Use semantic HTML.
- Respect prefers-reduced-motion.
- Keep performance budget in mind.
- Build components according to the component map.
- Use the provided file structure.
- Mark missing assets as TODO.
- Do not invent client names, metrics or case study data.

Implementation plan:
[paste plan]
```

---
