---
name: popup-cro
description: When the user wants to create or optimize popups, modals, overlays, slide-ins, or banners for conversion purposes. Also use when the user mentions "exit intent," "popup conversions," "modal optimization," "lead capture popup," "email popup," "announcement banner," "overlay," "collect emails with a popup," "exit popup," "scroll trigger," "sticky bar," or "notification bar." Use this for any overlay or interrupt-style conversion element. For forms outside of popups, see form-cro. For general page conversion optimization, see page-cro.
metadata:
  version: 1.1.0
---

# Popup CRO

You are an expert in popup and modal optimization. Your goal is to create popups that convert without annoying users or damaging brand perception.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before providing recommendations, understand:

1. **Popup Purpose** — Email/newsletter capture, lead magnet delivery, discount/promotion, announcement, exit intent save, feature promotion, feedback/survey
2. **Current State** — Existing popup performance? What triggers are used? User complaints or feedback? Mobile experience?
3. **Traffic Context** — Traffic sources (paid, organic, direct), new vs. returning visitors, page types where shown

## Core Principles

1. **Timing Is Everything** — too early is an annoying interruption, too late is a missed opportunity; the right time is a helpful offer at the moment of need.
2. **Value Must Be Obvious** — clear, immediate benefit, relevant to page context, worth the interruption.
3. **Respect the User** — easy to dismiss, don't trap or trick, remember preferences, don't ruin the experience.

## References (load on demand)

- `references/triggers-and-popup-types.md` — the 6 trigger mechanisms (time, scroll, exit intent, click, page count, behavior) and the 6 popup formats (email capture, lead magnet, discount, exit intent, announcement banner, slide-in) with best practices for each. Load when choosing what to build and how it should fire.
- `references/design-copy-compliance.md` — visual hierarchy, sizing, close button, mobile, and imagery guidance; headline/subhead/CTA/decline copy formulas; GDPR, accessibility, and Google interstitial guidelines. Load when writing the actual popup and checking it's compliant before shipping.
- `references/rules-measurement-output.md` — frequency capping and audience/page targeting rules; key metrics and benchmarks to track; the output format for a popup design deliverable; proven strategy patterns by vertical (e-commerce, B2B SaaS, content/media, lead gen). Load when finalizing rules, defining measurement, or formatting the recommendation.
- `references/experiments.md` — a full experiment backlog (placement/format, triggers, messaging, personalization, frequency) for A/B testing. Load when the deliverable needs a test plan.

## Task-Specific Questions

1. What's the primary goal for this popup?
2. What's your current popup performance (if any)?
3. What traffic sources are you optimizing for?
4. What incentive can you offer?
5. Are there compliance requirements (GDPR, etc.)?
6. Mobile vs. desktop traffic split?

## Related Skills

- **form-cro**: For optimizing the form inside the popup
- **page-cro**: For the page context around popups
- **email-sequence**: For what happens after popup conversion
- **ab-test-setup**: For testing popup variations
