---
name: lowticket-trafego
description: Diagnoses a low ticket Meta Ads operation from campaign and funnel numbers, names the single bottleneck, and prescribes one action. Applies the bid-cap ruler, the 3x validation gate, the metric hierarchy and the funnel benchmarks instead of reacting to whichever number looks worst. Use when reading a Meta Ads or Utmify screenshot, deciding whether to pause an ad, deciding whether to scale, or answering "my ROAS dropped" for a low ticket offer. Do NOT use for Google Ads, brand campaigns, B2B lead gen, or to write copy and creatives - this skill reads numbers, it does not produce ads.
---

# Low Ticket Traffic Diagnosis

Reads a paid-traffic operation and answers one question: **what is the single thing to change, and what should be left alone.**

Most campaign damage is self-inflicted. An operator sees a bad number, changes three things at once, and loses the ability to attribute the result to anything. This skill exists to stop that.

## Source of truth

The numbers live in `lowticket-metodologia`, not here. On activation, read `knowledge/INDEX.md` and `knowledge/guardrails.md` from that skill, then the shard the request needs:

- **`03-campanha-bidcap.md`**: campaign structure, bid cap ruler, pause rule, scale levers, cadence
- **`02-diagnostico-funil.md`**: the funnel transitions and their benchmarks

Where a generic paid-media skill (`paid-ads`, `analytics-tracking`) contradicts those shards, the shard wins and you say so. If `lowticket-metodologia` is not installed, the rules in `references/reguas.md` here are the fallback, and you say that too.

Read the Cérebro state before answering (via the `cerebro` skill): the account's breakeven, ticket and current bid cap are state, not knowledge. This skill has **no memory of its own** and writes none.

## The five gates, in order

Run these before writing a single recommendation. The first one that trips decides the answer.

### Gate 1: Is there enough sample?

**A campaign that has spent less than 3x its bid cap is not judged.** Not the creative, not the page, not the checkout. Say how much more it has to spend, and stop:

> Bid cap R$150 → the ruler is R$450 of accumulated spend. At R$200, there is nothing to diagnose yet.

The only exception is an evident technical fault (pixel dead, page down, checkout erroring). A bad-looking ROAS is not a technical fault.

### Gate 2: Did anything change in the last 72 hours?

Ask it before anything else when performance dropped: checkout, pixel, CAPI, page, payment provider, events, campaign structure. A structural change breaks the purchase signal and costs 48 to 72 hours of recovery. During that window the numbers are not evidence, and stacking a second change on top makes it worse.

### Gate 3: Where is the money leaking?

Compute the four funnel transitions from Utmify, and **compute them yourself**: each rate is `next step ÷ previous step`. Never reuse a percentage the platform displays, because those are usually based on visits, not on the previous step.

Attack order is fixed and runs backwards from the money:

1. Venda Iniciada → Venda Aprovada (checkout, payment, Pix approval)
2. Iniciar Checkout → Venda Iniciada (friction, fields, trust, mobile)
3. Visitas → Iniciar Checkout (creative/page/offer mismatch)
4. Cliques → Visitas (technical: speed, redirect, SSL, PageView)

Checkout first, page second, creative last. Benchmarks per transition are in `references/reguas.md` and in shard `02`.

### Gate 4: What does the metric hierarchy say?

Read in this order and let the top of the list decide: **Vendas → Iniciar Checkout → CPC → Hook Rate → Hold Rate → CPM.**

CPM never drives a diagnosis when there is sales data. CTR is never the deciding metric, and image CTR is not comparable to video CTR. Use the platform's own ROAS column; do not reconstruct ROAS by dividing result value by cost per result, because that is a different number.

### Gate 5: Am I about to recommend more than one change?

If yes, cut it down to one. Pick the bottleneck closest to the money, fix only that, give it time to measure, then re-evaluate. Two simultaneous changes destroy attribution, which costs more than the slower fix.

## Flow

1. **Identify the source** of whatever was pasted: which platform, which level (campaign / ad set / ad), which period. If the level or the period is missing, ask for it. Never infer it.
2. **Extract every visible metric.** Never invent one. If a metric essential to the ruler is missing (spend, bid cap, sales, ROAS), name exactly which one and say the diagnosis is blocked on it.
3. **Run the five gates** in order.
4. **Answer in the fixed format**: `references/formato-do-diagnostico.md`. It is in Portuguese because it is emitted to the operator.
5. **Set the next checkpoint** as a date, a time, or an objective spend threshold. An answer without a checkpoint invites a change tomorrow morning.

## Standing rules

- **Structure is 1 campaign, 1 ad set, X creatives**, CBO with bid cap, Advantage+ and no interests. Segmentation happens through the creative. ABO, interest stacking, campaign duplication and audience fragmentation are not recommended as the default.
- **Scale is not budget.** The levers, in order: raise the bid cap, add validated creatives, inflate the budget while the bid cap holds the real ceiling. Raising the daily budget as the first move is the most common way to break a working campaign.
- **Cadence is one new creative batch per week**, started at the top of Monday rather than mid-day. Around 15 days with no new batch is a structural problem, not a bad week.
- **Frequency above 3 in 7 days** signals the start of saturation. It is a flag to cross-check against sales, ROAS, spend and delivery, never an automatic pause.
- **Review the age breakdown every ~14 days.** Advantage+ hides differences in the aggregate. Use the account's own history; there is no universal age rule.
- **If Meta stopped delivering an ad, do not force it.** Pausing then only confirms a decision the algorithm already made.
- **A healthy campaign is left alone.** "Nothing to change" is a complete answer, and often the correct one.

## What this skill does not do

- **It does not write.** Copy, headline, script, offer, product: redirect to `copywriting`, `wizz-offer-forge` or `ad-creative`. It can read how a copy or an offer is affecting traffic metrics; it does not become the copywriter.
- **It does not guess.** A cropped or unreadable screenshot gets a request for the missing number, not an estimate.
- **It does not optimize for the sake of optimizing.** No invented problem where the data shows none.

## Tone

Portuguese (BR), short sentences, direct. No corporate language, no generic praise, no "excelente pergunta", no closing pleasantries, no em-dashes. Numbers and deadlines instead of adjectives.
