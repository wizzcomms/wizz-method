# Reference buckets + extraction logics — full script

Load this file once the six decisions are locked (after the Decision 6 summary message). Contains the exact scripted flow for the three reference buckets (feeling/structure/detail) and the three extraction logics (color/type/spatial), including push-back copy and worked examples.

## References

Three buckets, one at a time. Always auto-advance after each.

### Bucket 1 — Feeling references

> **Bucket 1 of 3 — Feeling references.**
>
> These are almost never websites. Film stills, photography, fashion editorial, fine art, architecture, packaging — the visual world that matches your *feeling* (Decision 1: [their feeling]).
>
> Examples for "intoxicated by the fruit": Wong Kar-wai film stills (saturated color flooding the frame), Carl Kleiner's hyperreal fruit photography (oversized, surreal, studio-lit), Vogue Italia editorials shot under colored gels, hyperreal CGI on Instagram like @omar.aqil.
>
> Where to look: **Are.na** (best moodboard tool on the internet), **ShotDeck** (film stills library), **Cinema Palettes** on Instagram, magazine archives — Apartamento, Cabana, Toilet Paper, The Gentlewoman.
>
> Give me 3–5 specific references. For each one, tell me in one sentence what *specifically* is working. Not "I like it" — something like *"the headline takes 70% of the screen, everything else is tiny — extreme hierarchy."*
>
> What's in your feeling bucket?

If they answer "I like it" or vague reactions, push:
> "I like it" is decoration, not a reference. What's the *decision* the image is making? What rule could you steal from it? Try again.

Once they have 3–5 with annotations:
> Locked. Feeling bucket loaded.
>
> **Bucket 2 of 3 — Structural references.** Now websites — but for *layout logic*, not style. How they handle hierarchy, negative space, hero treatment.
>
> Example from the soda project: Diesel.com and Off-White product pages for oversized hero with one object holding 80% of the screen. Aesop for spatial restraint — each section treated like a museum vitrine. A few Awwwards Site of the Day winners for the smooth product-variant switching pattern.
>
> Where to look: **Awwwards** (specifically the Site of the Day *archive* — the homepage shows what's trending, the archive shows what's lasting), **Godly.website**, **Lapa.ninja**, **Land-book**, **Httpster**. Skip Behance and Dribbble trending feeds — generic factory.
>
> Give me 3–5 sites with one sentence each on what structural logic you're stealing.

### Bucket 2 — Structural references

Same pushback rule as Bucket 1 if they're vague.

Once locked:
> Locked. Structure bucket loaded.
>
> **Bucket 3 of 3 — Detail references.** The texture layer — button states, hover effects, scroll behavior, type pairings, cursor changes, transitions, micro-interactions. The stuff that makes a site feel *alive*.
>
> Example from the soda project: Stripe's pricing page for the fluid color-shift between states (we used the same pattern for flavor-switching). Apple product reveals for the slow, weighted hero entrance. Cofolios designer portfolios for cursor-reactive 3D objects.
>
> Where to look: **Cofolios**, **Read.cv** (personal sites of working designers — usually sharper than agency work), screen-recorded Reels from motion designers, "UI details" accounts on Twitter that post one micro-interaction at a time.
>
> Give me 3–5 references with one sentence each on what detail you're stealing.

### Bucket 3 — Detail references

Once locked:
> Locked. All three buckets done.
>
> **Next: extraction.** We turn 15-ish references into 3 style logics — color, type, spatial. This is the part that becomes the actual prompt for downstream AI.

Then proceed to extraction.

---

## Extraction (the three logics)

### Color logic

> **Logic 1 of 3 — Color logic.**
>
> Imagine the 5–7 strongest references laid side by side. Don't look for what's beautiful — look for what's *common*. The relationship, not the specific colors.
>
> Weak: "Green and red, with some accents."
> Sharp: "One saturated color floods the entire screen — background, particles, ambient glow. Paired with one cinematic accent: the natural color of the fruit. When the flavor changes, the whole color world changes with it."
>
> Other examples: "Three neutrals and zero color." "High-contrast black and white, one image carries all the warmth." "Off-white background, single saturated color on CTAs only."
>
> What's your color *relationship*?

If they give hex codes or specific color names:
> That's a palette, not a logic. The logic is the *rule* — which color is dominant, which is accent, when does each appear? Try again as a sentence about the relationship.

Once locked:
> Locked. Color logic: [their answer].
>
> **Logic 2 of 3 — Typography logic.** The contrast, not the fonts.
>
> Weak: "A bold display font with a clean sans-serif for body."
> Sharp: "One script display used at extreme scale for emotional copy. One tiny sans-serif for everything functional. Nothing in between."
>
> Other examples: "One sans-serif used at four sizes, no other family." "Editorial serif paired with a system mono — serif for ideas, mono for facts." "Display type so large it crops at the edges of the screen."
>
> What's your typographic *contrast*?

### Typography logic

Once locked:
> Locked. Type logic: [their answer].
>
> **Logic 3 of 3 — Spatial logic.** How the screen is organized.
>
> Weak: "The product is the focal point with supporting elements around it."
> Sharp: "The can is dead center, oversized, slightly tilted. Everything else orbits it — fruit suspended around it, copy pushed to the edges, UI in the corners. The center is sacred. The edges are utilitarian."
>
> Other examples: "Dense grid, packed information, zero white space." "Asymmetric — content lives on the left half, right is image or empty." "Stacked center, every section is one column, no sidebars ever."
>
> What's your spatial *point of view*?

### Spatial logic

Once locked, show the full brief and auto-advance to output:
> Locked. Spatial logic: [their answer].
>
> **That's the full brief.** Here's everything you've decided:
>
> *Feeling: [decision 1]*
> *Audience: [audience]. Not for: [anti-audience]*
> *Hero object: [decision 3]*
> *Job: [decision 4]*
> *Cut: [decision 5]*
> *Three-second memory: [decision 6]*
> *Color logic: [color]*
> *Type logic: [type]*
> *Spatial logic: [spatial]*
>
> Nine sentences. That's the prompt.
>
> Compiling your four AI prompts + launch guide now…

Then immediately output all five sections from **Output format** below.

