# Wizz Low Ticket

A portable knowledge base and four operating skills for **low ticket direct response** in Brazil and Portugal: offers between roughly R$19 and R$97, sold cold on Meta Ads, on a phone, mostly inside the Instagram in-app browser.

Install it and a fresh machine has the methodology and the four agents working, with no extra setup.

## What ships

| Skill | Does | Use when | Do not use when |
|---|---|---|---|
| `lowticket-metodologia` | routes a request to the one knowledge shard that answers it, loads the guardrails alongside | any low ticket work: offer, creative, page, campaign, funnel | SaaS, B2B, client site, high ticket |
| `lowticket-trafego` | campaign diagnosis and ruler: structure, bid cap, when to cut, how to scale | reading, cutting or scaling a Meta campaign | Google Ads, brand campaigns, writing ads |
| `lowticket-funil` | the post-checkout ladder: upsell, downsell, final offer, price rules | after the front-end converts, to raise average order value | before a front-end that converts exists |
| `lowticket-minerador` | mining and judging a competitor offer, with a cut-off rubric | hunting a new offer to model | the offer is already defined (use `wizz-offer-forge`) |
| `lowticket-pagina` | page performance: connect rate, LCP, pixel order, acceptance targets | optimizing or building a low ticket sales page | institutional sites or apps |

All five read the Cérebro on activation and **none of them keeps its own memory**, the same contract as `wizz-offer-forge`. What is decided lives in the Cérebro; what is known lives in the shards.

## The loading contract

The knowledge base is 20 shards. It is not loaded whole. Reading everything costs around 36k tokens; a typical answer needs under 5k.

| Step | Read | When |
|---|---|---|
| 0 | `knowledge/INDEX.md` + `knowledge/guardrails.md` | always |
| 1 | **one** shard named by the INDEX | the request matches a trigger |
| 2 | the raw source on the operator's machine | rare: the shard did not answer |

## Language

The framework surface is English: this file, the module definition, the SKILL.md frontmatter, the registry entry. **The knowledge is Portuguese**: the shard bodies, their filenames, the INDEX, the guardrails, the table headers.

That split is deliberate. The market this describes is BR/PT and the vocabulary is native (`bid cap`, `connect rate`, `order bump`, `Utmify`, `Pix`); translating it would make it less precise, not more portable. Decision recorded 2026-08-28.

## Origin

The knowledge here is a distillation: facts, benchmarks, checklists and critical analysis, written from scratch. **No third-party lesson text, transcript, PDF or prompt ships in this package.** Raw sources stay on the author's machine, outside npm and outside git.

If you extend a shard, keep it that way: write the fact, never the quote. `knowledge/15-como-estender.md` has the full process.

Three tactics present in the source material are recorded and **not adopted** in `knowledge/guardrails.md`: buying engagement, AI avatars passing as real people, and synthetic testimonials. They are loaded on every activation and stay blocked until the operation's owner decides otherwise.

## Optional config

The creative swipe file (155 real pieces, ~2 GB of video and image) does not travel. The written analysis of it, `CATALOGO.md`, does, and it is enough to work from.

To let the agent open a specific piece, point at the folder during install, or pin it by hand:

```toml
# _wizz/custom/config.user.toml  (never overwritten by the installer)
[modules.lowticket]
swipe_file_path = "/absolute/path/to/the/swipe/file"
```

Resolution order and the exact wording to use when the folder is absent: `skills/lowticket-metodologia/references/swipe-file.md`.
