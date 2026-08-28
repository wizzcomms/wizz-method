---
name: lowticket-pagina
description: Performance engineering for a low ticket direct-response sales page served to Meta traffic on mobile - fixes connect rate by cutting redirects, ordering the pixel, and hitting hard LCP, TTFB, CLS and page-weight targets, then reports before/after. Use when connect rate is below 92%, when a sales page is slow on mobile, or when building a new low ticket page. Do NOT use to write or restructure the copy, the offer or the price - this skill is the engineer, not the copywriter - and do NOT use for institutional sites or apps.
---

# Low Ticket Sales Page Engineering

A direct-response page for Meta traffic is almost always opened on a phone, on a Brazilian mobile network, **inside the Instagram in-app browser**, which is slower than native Chrome or Safari. Every decision here follows from that.

## The metric

```
connect rate = visualizações da página de destino ÷ cliques no link
```

**The technical fact that drives everything:** a landing page view is counted when the Meta pixel's `PageView` event fires. So connect rate measures **the moment the pixel can speak**, not the moment the person sees the offer.

That creates two clocks, and both have to be optimized:

| Clock | What it is | What it governs |
|---|---|---|
| Time to pixel | when `fbq('track','PageView')` executes | the connect rate in the ads manager |
| Time to hero | LCP: when the largest visible element paints | the actual sale |

**Integrity rule.** You can raise connect rate by moving the pixel to the top of `<head>` without making the page any faster. That is metric makeup. **Never do only that.** Move the pixel *and* fix the page. If only one is possible, say so explicitly in the final report.

## Honest boundary, say it early

Speed fixes the leak between the click and the page. It does not fix a bad offer, a bad creative or a bad checkout. **If connect rate is already above 92%, the problem is somewhere else** and this skill is the wrong tool. Route to `lowticket-trafego` (find the real bottleneck) or `lowticket-minerador` (the offer itself).

## Source of truth

Read the Cérebro state first (via the `cerebro` skill). If `lowticket-metodologia` is installed, read `knowledge/INDEX.md` + `knowledge/guardrails.md` and shard `06-pagina-vendas.md`, especially §6.3-6.4. Page structure and copy blocks live in that shard and in `12b-fabrica-de-ofertas.md` §12.7-A; conversion-side reasoning is `page-cro`. Where a generic skill contradicts the shard, the shard wins and you say so.

This skill has **no memory of its own**.

## Acceptance targets

The job is done when all of these are met, measured **on mobile with 4G throttling**, never on desktop. Full measurement instructions in `references/metas-e-medicao.md`.

| Metric | Target |
|---|---|
| Redirects between ad link and page | **0** |
| TTFB | **< 200 ms** |
| LCP | **< 2.0 s** (ideal < 1.5 s) |
| CLS | **< 0.1** |
| Time to `PageView` | **< 800 ms** |
| Compressed HTML | **< 50 KB** |
| Total weight above the fold | **< 250 KB** |
| Own blocking JavaScript | **0 KB** |

## Execution order

Ordered by return on effort, not by technical elegance. Stop and report if a step blocks.

1. **Diagnose.** Check redirects on the exact ad link. Measure LCP, TTFB and CLS on mobile. Find where the pixel sits in the HTML. These numbers are the "before" column.
2. **The road.** Zero redirects. One host. Direct `https`. No shortener, no pre-sell page that only redirects.
3. **Where the page lives.** Static HTML built ahead of time and served from a CDN. Configure cache headers.
4. **Pixel.** First script in `<head>`. Remove the tag manager from the critical path.
5. **Images.** Resize, then convert. `Picture` with avif+webp on the hero, lazy on everything below the fold.
6. **Font and CSS.** System font, or a subsetted self-hosted woff2. Inline the critical CSS. Drop what is unused.
7. **Player.** Static cover as a facade, respecting the autoplay answer.
8. **Secondary scripts.** Defer all of them.
9. **Re-measure.** Repeat step 1 and build the before/after table.

Code patterns for steps 4 to 8 are in `references/padroes-de-codigo.md`.

## Non-negotiable rules

### Never

- A redirect between the ad link and the page. Not a shortener, not `http→https`, not `www→no www`, not a pre-sell page that only redirects.
- The Meta pixel inside a web worker. It improves the Lighthouse score and delays or breaks `PageView`, which **is** the connect rate. Bad trade.
- The pixel after the CSS, after the title, or at the end of `<body>`.
- `loading="lazy"` on the hero image, or its absence below the fold.
- A font served from a third-party domain. It costs a DNS lookup, a TLS handshake and a new connection.
- The VSL player script in the critical rendering path.
- An image delivered wider than the box it renders in.
- **Rewriting the copy, the headline, the prices, the testimonials or the offer structure.** On this task you are a performance engineer. Notice a copy problem, mention it in the report, change nothing.

### Always

- Static HTML, generated at build time, served from a CDN.
- The pixel as the first script in `<head>`.
- Explicit `width`/`height` or `aspect-ratio` on every image and video, so CLS stays at zero.
- `preconnect` for the third-party domains that are unavoidable: player, the Meta connect domain, checkout.
- Test with 4G throttling, never on the local network.
- Preserve existing conversion behavior: buttons, anchors, UTM parameters on the checkout URL, CTA reveal delays synced to the video.

## Asking for what is missing

At most **five questions, all in one round**, and only when something essential is genuinely missing. If nothing essential is missing, ask nothing and execute. Priority:

1. What is the **exact** link inside the ad? (the ad's link, not the page URL)
2. Is there access to the code, or is it a closed page builder?
3. Does the VSL need autoplay to work?
4. Is a consent banner blocking scripts?
5. What is the pixel ID?

**If the page is on a closed builder**, apply everything the platform allows (pixel order, image conversion, player facade, script removal, redirect removal) and state plainly in the report which targets became unreachable and why.

## The final report is mandatory

Always end with the before/after table from `references/metas-e-medicao.md`, in plain Portuguese, written for someone who is not technical. Every metric that missed its target gets one sentence explaining what that means. The report also carries what could not be done and why, the conscious trade-offs taken, and what the operator has to do by hand.

An optimization without the report is not finished work: the point is that the operator can see the movement and decide whether it was worth it.
