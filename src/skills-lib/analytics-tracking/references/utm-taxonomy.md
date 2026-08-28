# UTM Taxonomy and Governance

A UTM scheme is only worth what its weakest tag is worth. One free-text `utm_source` per person and the channel report is fiction within a month. This reference is the governance layer: the allowed values, the naming standard, and who owns it.

For auditing a direct-response funnel (pixel, CAPI, checkout passthrough, test purchase per route), use the `tracking-audit` skill instead. This file defines the taxonomy; that skill proves it is installed correctly.

## The one rule

**Every value comes from a closed list.** If a value is not on the list, it does not go in the URL: it goes to whoever owns the taxonomy, gets added to the list, and only then gets used. Free text in `utm_source` is the single most common cause of a useless channel report.

## Canonical values

### utm_source — where the click came from

Use the platform, never the campaign or the person.

| Value | Use for |
|---|---|
| `google`, `bing` | search and display networks |
| `facebook`, `instagram` | Meta placements (keep them separate: the reports differ) |
| `tiktok`, `kwai`, `pinterest`, `linkedin`, `x` | the named platform |
| `youtube` | YouTube, whether organic or paid |
| `whatsapp`, `telegram` | messaging apps |
| `newsletter`, `email` | owned lists (pick one and keep it) |
| `partner-<slug>` | affiliates and partners, one slug per partner |

### utm_medium — the kind of traffic

This is the field that feeds channel grouping. Keep it tiny.

| Value | Use for |
|---|---|
| `cpc` | paid click auctions |
| `paid-social` | paid social placements |
| `organic-social` | unpaid posts, stories, bio links |
| `email` | any email send |
| `affiliate` | affiliate and partner traffic |
| `referral` | links from other sites you do not control |
| `qr` | printed or physical placements |

Do not invent `facebook-ads` as a medium. Platform belongs in `utm_source`; `utm_medium` answers "what kind of traffic is this".

### utm_campaign, utm_content, utm_term

- `utm_campaign`: the offer or initiative, not the month. `black-friday-2026`, not `campanha-nova`.
- `utm_content`: what distinguishes two versions of the same placement. Creative, headline variant, or button.
- `utm_term`: keyword for search, placement for social.

## Naming standard

- lowercase, no accents, no spaces
- hyphen between words, underscore never mixed in halfway
- fixed field order, decided once and written down
- never `|`, `#`, `&` or `?`: they are delimiters inside the tag string and they break attribution silently

Renaming later does not fix a bad name. Ad platforms keep serving the old name from cache for impressions already delivered, so the historical report stays split.

## Brazil and Portugal specifics

Direct-response operations in BR and PT usually route through a checkout platform that owns the final domain. Two consequences:

1. **The checkout may not forward `utm_*`.** Several platforms (Hotmart, Kiwify, Eduzz, Monetizze, Braip and similar) carry a native parameter of their own. Pack the same identifiers into that native parameter as well, so the sale webhook still knows the origin. The exact parameter name is platform-specific: confirm it in the platform docs before writing the template.
2. **Payment method changes the funnel shape.** PIX and card approve at different rates and on different clocks. Split "sale started to approved" by payment method or the number means nothing.

Owned routes that people forget to tag, and that inflate the organic bucket:

| Route | Suggested tag |
|---|---|
| Instagram bio link | `utm_source=instagram&utm_medium=organic-social&utm_campaign=bio` |
| Instagram highlight | `utm_source=instagram&utm_medium=organic-social&utm_campaign=destaque-<name>` |
| Story swipe up | `utm_source=instagram&utm_medium=organic-social&utm_campaign=story-<date>` |
| WhatsApp broadcast | `utm_source=whatsapp&utm_medium=referral&utm_campaign=<list>` |
| Link in a printed piece | `utm_source=<place>&utm_medium=qr&utm_campaign=<piece>` |

"Organic" is not a channel. It is the bucket of everything that arrived untagged. Tag every owned route and watch it shrink: the size of the drop is how much the bucket was lying.

## Attribution by ID

Whenever the ad platform exposes an object ID, carry both name and ID:

```
utm_campaign=<campaign-name>|<campaign-id>
```

Names get renamed; IDs do not. Attribution keyed on the name breaks the first time someone tidies up the ad account.

## Governance

- One owner for the taxonomy. Not a team, a person.
- One document with the closed lists, linked from wherever campaigns are built.
- A monthly check for values outside the lists. Anything outside is either an addition to the list or a fix at the source.
- A link builder (spreadsheet or small form) beats hand-typed URLs. Hand-typed URLs are where the typos come from.
