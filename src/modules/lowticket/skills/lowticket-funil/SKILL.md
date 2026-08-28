---
name: lowticket-funil
description: Designs the post-checkout ladder for a low ticket offer - upsell 1, upsell 2, downsell and a final offer - deciding what each step sells, which pain it answers, what it costs and why it sits in that position, then writes the pages. Use when a front-end offer already converts and the goal is to raise average order value, or when an existing upsell sequence is not converting. Do NOT use before a front-end that converts exists, and do NOT use for traffic, campaigns or the front-end offer itself.
---

# Low Ticket Funnel Extension

Turns a single product into a post-checkout ladder. The whole discipline reduces to one question, asked at every step:

**After this person buys this, what is the next problem they inevitably hit?**

Every offer in the ladder exists because it answers that question for the step before it. An offer that does not answer it is a random product bolted onto a checkout, and it converts like one.

## Prerequisite

**There has to be a front-end that converts.** Extending a funnel above a front that does not sell multiplies zero. If the front is not validated, say so and point to `wizz-offer-forge` (build the offer) or `lowticket-trafego` (find out why it is not selling).

## Source of truth

Read the Cérebro state first (via the `cerebro` skill). Then, if `lowticket-metodologia` is installed, read `knowledge/INDEX.md` + `knowledge/guardrails.md` and the shard `07-funil-upsell.md`, especially §7.4 (the conversion and ticket cascade). Where a generic skill contradicts that shard, the shard wins and you say so.

This skill has **no memory of its own**. What gets decided goes to the Cérebro; the artifact goes to a file.

## Flow, in five moves

Do not deliver the whole thing at once. Each move ends with a question, and the answer shapes the next one.

### 1. Four questions, one message

Explain in two lines what you are about to do, then ask exactly these, together:

1. What is the front-end product? Name and what it delivers.
2. What does it cost today?
3. What is the main pain it solves?
4. Who is it for? Audience, age band or situation.

No follow-up questions at this stage unless something is missing outright.

### 2. Diagnosis and two paths

Restate what you heard in one line: *"Seu front é [produto] para [público]. Ele resolve [dor]. O ticket é [valor]."*

Then offer **two** expansion paths, each with: the complementary pain, the product that would answer it, and why that pain shows up *after* the front-end. Explain the reasoning in plain language and ask which one fits. Develop a third only if asked.

Two paths, not five. A menu is not a recommendation.

### 3. The map

Build the full ladder using the template in `references/mapa-do-funil.md`. Every step carries: name, price, pain, why it sits in that position, and three outcome bullets.

Then state the flow out loud:

```
Front → Checkout → U1 → aceitou: U2 · recusou: Downsell → Oferta Final → Obrigado
```

Ask: adjust a product first, or write the copy?

### 4. The pages

One page per step, in the fixed 10-block order from `references/copy-das-paginas.md`. Tone shifts by step: aspirational on the front, celebratory on the upsell, empathetic on the downsell, plainly useful on the final offer.

### 5. Implementation

Offer, in this order: ready HTML, help with one-click OTO, adaptation to the platform in use, or adjusting the offers.

## The rules that decide the ladder

### Product

- **An upsell is not a discount on the front.** U1 solves a *complementary* pain: the front teaches how to do X, U1 helps apply X.
- **U2 is the natural next step for whoever took U1**, a more advanced pain. It is never shown to someone who refused U1.
- **A downsell is a different, simpler product**, not the same product cheaper. "Você recusou por R$97, mas leva por R$27" is a discount, not a downsell. Reach for a checklist, a template, a condensed version, a fast-implementation kit, a tool, a script.
- **The final offer answers a broad, frequent pain of the niche**, so nearly every buyer can want it.

### Price

| Step | Rule |
|---|---|
| Upsell 1 | 40% to 60% of the front price |
| Upsell 2 | around U1, up to ~20% above |
| Downsell | 10% to 25% **of the product that was refused**, not of the front |
| Final offer | low enough for an instant decision; in BR, roughly R$9 to R$15 as a practical floor |

Never raise the front price to make the ladder look more sophisticated. If the price was not given, ask before building the map.

### Architecture

Three paid steps after checkout, maximum. Everyone reaches the final offer. **U2 and the downsell are never shown to the same person.** Post-checkout offers should be one-click OTO; if the platform in use does not support that, say so before promising the implementation.

If asked for five or more paid steps, say the recommendation is to consolidate. A longer ladder is not a bigger ladder.

### Numbers, only when asked

Treat these as reference, never as a promise: U1 15-25%, U2 20-35% among U1 buyers, downsell 20-35%, final offer 18-28%, total ticket around 1.5x to 2.3x the front. The canonical version is §7.4 of shard `07`.

## Hard limits on the copy

- **Never invent product facts.** Missing price, audience, pain, promise or mechanism: stop and ask. Do not fill the gap with something plausible.
- **Never invent social proof.** No student counts, revenue, conversion rates, testimonials or results unless the user supplied them. No proof means no proof block.
- **Never invent scarcity.** A one-time offer inside a funnel is real scarcity and can be said. A fake countdown, an invented deadline, a fictional seat count or a made-up price increase is not, and does not ship.
- **Bullets are outcomes, not contents.** "12 módulos, 8 aulas, PDF de 40 páginas" is an inventory. "Você monta a primeira campanha sem travar na tela em branco" is an outcome.

## Voice

Portuguese (BR), spoken register, short sentences, no em-dashes. Concrete scenes instead of abstract emotion: not "você se sente inseguro", but "você abre o computador às 9h e às 11h ainda está tentando descobrir por onde começar". Repeat the product's name instead of cycling through synonyms.

The full anti-AI word list and the rhythm rules are in `references/copy-das-paginas.md`. For a deeper pass, hand the draft to the `humanizer` skill.

## Out of scope

Traffic, campaigns, hiring, accounting, general operations. Bring it back to product, offer, price, pain, post-checkout sequence and copy, or route: `lowticket-trafego` for campaigns, `wizz-offer-forge` for the front-end offer, `lowticket-pagina` for the sales page itself.
