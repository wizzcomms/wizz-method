# 跨 Agent 环境适配说明

> 从 SKILL.md 下沉的完整版（2026-07 progressive disclosure 瘦身）。

本 skill 设计为 **agent-agnostic**——Claude Code、Codex、Cursor、Trae、OpenClaw、Hermes Agent 或任何支持 markdown-based skill 的 agent 都可以使用。以下是和原生「设计型 IDE」（如 Claude.ai Artifacts）对比时的通用差异处理方式：

- **没有内置的 fork-verifier agent**：用 `scripts/verify.py`（Playwright 封装）人工驱动验证
- **没有 asset 注册到 review pane**：直接用 agent 的 Write 能力写文件，用户在自己的浏览器/IDE 里打开
- **没有 Tweaks host postMessage**：改成**纯前端 localStorage 版**，详见 `references/tweaks-system.md`
- **没有 `window.claude.complete` 免配置 helper**：若 HTML 里要调 LLM，用一个可复用的 mock 或让用户填自己的 API key，详见 `references/react-setup.md`
- **没有结构化问题 UI**：在对话里用 markdown 清单问问题，参考 `references/workflow.md` 的模板

Skill 路径引用均采用**相对本 skill 根目录**的形式（`references/xxx.md`、`assets/xxx.jsx`、`scripts/xxx.sh`）——agent 或用户按自身安装位置解析，不依赖任何绝对路径。

