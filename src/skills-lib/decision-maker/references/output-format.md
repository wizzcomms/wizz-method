# Output format — the five deliverables

Load this file when the brief is complete (spatial logic locked) or when the user runs `/output`. Contains the exact copy-paste templates for the five output sections: Copywriter prompt, 3D/Illustration prompt, Design prompt, Developer prompt, and the GitHub + Vercel launch guide, plus the closing message.

## Output format

When the brief is complete (or when the user runs `/output`), produce exactly five sections in this order. Each prompt in a code block, copy-paste ready.

If any decisions, references, or logics are missing, tell the user what's missing and walk them back through that section.

---

### Section 1 — Prompt for Copywriter AI

```
You are a senior brand copywriter. Write the copy for a website with this brief:

BRIEF:
- Feeling: [decision 1]
- Audience: [audience]
- Anti-audience: [anti-audience]
- Hero object: [decision 3]
- Job: [decision 4]
- Three-second memory: [decision 6]

TONE: Match the feeling. The visitor should not read — they should feel. One sentence per screen. No filler. No hedging. Banned words: modern, clean, minimal, premium, professional, elegant.

OUTPUT:
1. Hero headline (max 4 words)
2. Hero subheadline (max 12 words)
3. Section headlines for: [list cut-survivor sections from decision 5]
4. Microcopy for primary CTA (max 2 words)
5. Footer line (one sentence)

Return as JSON.
```

### Section 2 — Prompt for 3D / Illustration AI

```
Generate a hero visual for a website with this direction:

HERO OBJECT: [decision 3]
FEELING: [decision 1]
COLOR LOGIC: [color logic]
SPATIAL LOGIC: [spatial logic]

STYLE NOTES:
- The object should be oversized, slightly tilted, centered.
- Background: dominant color floods the entire frame.
- Lighting: cinematic, soft rim light, slight depth of field.
- Resolution: 4K, transparent background.
- No humans, no environments, no context — just the object in atmosphere.

REFERENCE AESTHETIC: [pull 2–3 visual feeling references from bucket 1]

Tool suggestion: Midjourney for the hero, GPT Image / Recraft for variants, Remove.bg for cleanup, Squoosh for WebP compression under 2MB.
```

### Section 3 — Prompt for Design AI (Figma / layout spec)

```
Design a landing page layout with this spec:

VISUAL DECISIONS:
- Feeling: [decision 1]
- Hero object: [decision 3]
- Job: [decision 4]

STYLE LOGICS:
- Color: [color logic]
- Type: [type logic]
- Spatial: [spatial logic]

SECTIONS (in order, top to bottom):
[list cut-survivor sections from decision 5]

LAYOUT RULES:
- Hero: hero object dead center, oversized, slightly tilted. Copy pushed to one edge. Nav at top edge. Awards/badges at bottom corner.
- Every section follows the spatial logic above.
- Mobile-first responsive. Stack all grids to single column under 768px.

DELIVERABLE: A Figma frame or layout spec showing the hero + 2–3 below-fold sections.
```

### Section 4 — Prompt for Developer AI (Claude Code / Cursor)

```
Build a premium animated landing page with this spec:

ASSETS:
- /assets/images/hero.webp (hero object — see 3D output)
- /assets/copy.json (see copywriter output)

STYLE TOKENS (CSS custom properties):
- Color logic: [color logic — translate to --color-primary, --color-accent, --color-bg]
- Type logic: [type logic — translate to --font-display, --font-body with size scale]
- Spatial logic: [spatial logic — translate to layout grid rules]

FEATURES TO BUILD:
- Hero: GSAP spring entrance for the hero object. Cursor-reactive — hero object subtly follows mouse position. Staggered word reveal on headline (60ms).
- [If product has variants:] Smooth state-change between variants — background color, accent color, and hero object all transition together.
- Magnetic CTA: button slightly follows cursor within 40px on hover.
- Smooth scroll indicator at bottom of hero.
- Scroll-triggered fade+slide-up animations on sections (120ms stagger).
- Mobile-first responsive. Respect prefers-reduced-motion.

TECH STACK:
- Plain HTML/CSS/JS or Next.js (your choice).
- GSAP for animations.
- Lighthouse targets: Performance 90+, AA contrast, no layout shift, font preloaded, images lazy-loaded WebP.

OUTPUT: index.html, style.css, animations.js (or component files if Next.js).
```

### Section 5 — Launch with GitHub + Vercel

```
LAUNCH GUIDE

1. INITIALIZE GIT
   Open the project folder in Terminal.
   - git init
   - git add .
   - git commit -m "Initial commit"

2. CREATE GITHUB REPO
   - Go to github.com → New repository.
   - Name it [project-slug]. Private.
   - Skip README / .gitignore (you already have files).
   - On the next page, copy the two commands under "push an existing repository from the command line."
   - Paste them in Terminal. Your code is now on GitHub.

3. DEPLOY TO VERCEL
   - Go to vercel.com, sign in with GitHub.
   - Click "Add New" → "Project".
   - Select your repo.
   - Vercel auto-detects the framework (use "Other" for plain HTML).
   - Leave defaults. Click "Deploy".
   - 30–60 seconds later you have a live URL: [project].vercel.app.

4. CUSTOM DOMAIN (optional)
   - In Vercel → Settings → Domains.
   - Add your domain. Vercel shows DNS records.
   - Go to your registrar (Namecheap, GoDaddy, Cloudflare) and paste them.
   - 5–30 minutes for DNS to propagate. Live on your domain.

5. PUSH UPDATES
   - Any time you make changes: git add . && git commit -m "update" && git push
   - Vercel auto-deploys every push.

THE SITE IS LIVE.
```

After outputting all five sections, close with:
> That's everything. Five outputs, ready to use.
>
> Hand sections 1–4 to the matching AI tools (Claude, Midjourney, Figma plugin, Cursor or Claude Code). Then run the launch guide.
>
> If you want to redo any part of the brief, type `/redo [section]` — for example `/redo decision 3` or `/redo color logic`.

