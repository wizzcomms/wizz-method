# Starter Components（assets/ 下的起手组件清单）

> 从 SKILL.md「Starter Components」下沉的完整版（2026-07 progressive disclosure 瘦身）。造好的起手组件，直接 copy 进项目使用。

造好的起手组件，直接copy进项目使用：

| 文件 | 何时用 | 提供 |
|------|--------|------|
| `deck_index.html` | **幻灯片的默认基础产物**（不管最终出 PDF 还是 PPTX，HTML 聚合版永远先做） | **直接复制、不要重写其概览逻辑**。自带**两种自适应概览**（打开按秒数随机：网格 iframe 60% / 无限画廊图片 40%）+ 键盘翻页 + scale + 计数器 + 打印合并，每页独立 HTML 免 CSS 串扰，点任意卡片进演示。用法：复制为 `index.html`、编辑 MANIFEST（每项 `{file,label}`；**要用画廊模式则加 `thumb` 字段并先跑 `scripts/gen_deck_thumbs.mjs` 生成缩略图**，否则画廊回退 iframe 会卡）。⚠️ 概览墙已内建解决「任意页数自适应 / 卡片点击命中 / 倾斜不裁切」三个坑——**别自己重写倾斜或网格逻辑**，要改先读 `references/slide-decks.md` 的三条硬约束 |
| `scripts/gen_deck_thumbs.mjs` | **给无限画廊概览生成缩略图**（网格 iframe 模式不需要）| playwright 截每页 + sharp 降采样 1600px JPEG：`npm i playwright sharp && node gen_deck_thumbs.mjs --slides slides --out thumbs`，再给 MANIFEST 每项加 `thumb`。分辨率别 <1000px 否则 hover 发虚 |
| `deck_stage.js` | 做幻灯片（单文件架构，≤10页） | web component：auto-scale + 键盘导航 + slide counter + localStorage + speaker notes ⚠️ **script 必须放在 `</deck-stage>` 之后，section 的 `display: flex` 必须写到 `.active` 上**，详见 `references/slide-decks.md` 的两个硬约束 |
| `scripts/export_deck_pdf.mjs` | **HTML→PDF 导出（多文件架构）** · 每页独立 HTML 文件，playwright 逐个 `page.pdf()` → pdf-lib 合并。文字保留矢量可搜。依赖 `playwright pdf-lib` |
| `scripts/export_deck_stage_pdf.mjs` | **HTML→PDF 导出（单文件 deck-stage 架构专用）** · 2026-04-20 新增。处理 shadow DOM slot 导致的「只出 1 页」、absolute 子元素溢出等坑。详见 `references/slide-decks.md` 末节。依赖 `playwright` |
| `scripts/export_deck_pptx.mjs` | **HTML→可编辑 PPTX 导出** · 调 `html2pptx.js` 导出原生可编辑文本框，文字在 PPT 里双击可直接编辑。**HTML 必须符合 4 条硬约束**（见 `references/editable-pptx.md`），视觉自由度优先的场景请改走 PDF 路径。依赖 `playwright pptxgenjs sharp` |
| `scripts/html2pptx.js` | **HTML→PPTX 元素级翻译器** · 读 computedStyle 把 DOM 逐元素翻译成 PowerPoint 对象（text frame / shape / picture）。`export_deck_pptx.mjs` 内部调用。要求 HTML 严格满足 4 条硬约束 |
| `design_canvas.jsx` | 并排展示≥2个静态variations | 带label的网格布局 |
| `animations.jsx` | 任何动画HTML | Stage + Sprite + useTime + Easing + interpolate |
| `ios_frame.jsx` | iOS App mockup | iPhone bezel + 状态栏 + 圆角 |
| `android_frame.jsx` | Android App mockup | 设备bezel |
| `macos_window.jsx` | 桌面App mockup | 窗口chrome + 红绿灯 |
| `browser_window.jsx` | 网页在浏览器里的样子 | URL bar + tab bar |

用法：读取对应 assets 文件内容 → inline 进你的 HTML `<script>` 标签 → slot 进你的设计。

