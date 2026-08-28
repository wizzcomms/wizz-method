---
name: lowticket-metodologia
description: Routes any low ticket direct-response question to the one knowledge shard that answers it, and loads the guardrails alongside. Covers funnel diagnosis, bid-cap campaigns, creatives, offers, sales pages, Instagram, upsell ladders, offer mining and market benchmarks for the BR/PT market. Use when working on a low ticket offer (roughly R$19 to R$97), a Meta Ads campaign for one, its sales page, its creatives, its upsell ladder, or when auditing why one is not converting. Do NOT use for SaaS, B2B, client websites, high ticket or mentorship funnels - the numbers here do not transfer.
---

# Low Ticket Methodology

A knowledge base of 20 shards in Portuguese, plus a swipe file analysis of 155 real creatives. The knowledge is loaded **one shard at a time**: the full base is around 36k tokens, a typical answer needs under 5k.

Everything below the surface of this skill is in Portuguese on purpose. The market it describes is Brazil and Portugal, and the vocabulary (`bid cap`, `connect rate`, `order bump`, `Utmify`, `Pix`) is how the operators actually speak. Answer the user in their language; read the shards as they are.

## The loading contract, in three steps

| Step | Read | When |
|---|---|---|
| 0 | `knowledge/INDEX.md` **and** `knowledge/guardrails.md` | always, on activation |
| 1 | **one** shard named by the INDEX | the request matches a trigger |
| 2 | the raw source on the operator's machine | rare: the shard did not answer |

Never open two shards to find out which one it was. The INDEX has a third column ("Tem lá") precisely so you do not have to guess. If the INDEX did not resolve the request, the INDEX line is the bug: say so, answer from the closest shard, and suggest the fix.

## Precedence

**Where a generic skill contradicts a shard, the shard wins, and you say that in the answer.**

This matters constantly. `wizz-offer-forge` defaults to a R$10-97 low ticket band and 7/15/30 day guarantees; this base pins price by source band (R$19,90 / R$27 / R$37), upsell at 2 to 2.5x the entry, and has an unresolved point about 7 vs 14 day guarantees. Same for `page-cro`, `paid-ads` and `ad-creative`: the generic skill has the technique, this base has the numbers for this market.

The one thing that outranks a shard is `knowledge/guardrails.md`. Three tactics present in the source material are recorded there and **not adopted**: buying engagement, AI avatars passing as real people, and synthetic testimonials. They are blocked until the operation's owner decides otherwise. If a shard teaches one, the inline block line is there too.

## Flow

### Step 0: Read the state, then the index

Read the project's Cérebro state block first (via the `cerebro` skill: current project state plus at most 3 decisions on the topic). This skill has **no memory of its own** and never writes one. What is decided lives in the Cérebro; what is known lives in the shards.

Then read `knowledge/INDEX.md` and `knowledge/guardrails.md`. That is the whole default load, around 800 tokens.

### Step 1: Resolve the request to one shard

Match the request against the INDEX trigger column. Load that file and nothing else.

If the request spans two shards (common: "the page is not converting" touches both the page shard and the funnel diagnosis shard), pick the shard that answers the **question asked**, not the one with the most adjacent material. Say which one you picked.

### Step 2: Answer with the numbers, not the theory

The value of this base is that it is numeric: 5 funnel transitions with benchmarks, the 3x bid cap rule, 40-60s creatives, connect rate above 92%, U1 at 15-25%. Quote the number and the shard section (`§3.7`, `§7.4`). An answer that paraphrases the principle without the number has thrown away the base.

### Step 3: When the base does not close the question

`knowledge/pontos-em-aberto.md` holds the contradictions found while distilling, numbered. If the request lands on one of them (guarantee length, one price or two plans, upsell at 2x or 2.5x, creatives per ad set), **say the point is open and ask** instead of picking a side silently.

## The creative swipe file

`CATALOGO.md` at the root of this skill is the written analysis of 155 real creatives: composition, median duration, screen format, hook type, and a cross-check of which of the 14 visual templates the pieces actually use. It ships with this skill and always works.

The video and image files themselves do not ship. To open a specific piece, the swipe file has to be on the machine and pointed at. See `references/swipe-file.md` for how that path is resolved and what to say when it is not there.

## What this skill does not do

- **It does not write.** It routes and it cites. Producing the offer is `wizz-offer-forge`, the page is `page-cro`, the copy is `copywriting`, the campaign is `paid-ads`.
- **It does not remember.** No state file, no notes. The Cérebro is the memory.
- **It does not travel outside its market.** SaaS, B2B, client sites and high ticket have different math. Say so rather than stretching the numbers.
