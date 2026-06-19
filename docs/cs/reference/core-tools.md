---
title: Základní nástroje
description: Reference všech vestavěných úkolů a workflow dostupných v každé instalaci BMad bez dalších modulů.
sidebar:
  order: 3
---

Každá instalace BMad zahrnuje sadu základních skills, které lze použít v kombinaci s čímkoli — samostatné úkoly a workflow, které fungují napříč všemi projekty, všemi moduly a všemi fázemi. Ty jsou vždy dostupné bez ohledu na to, které volitelné moduly nainstalujete.

:::tip[Rychlá cesta]
Spusťte jakýkoli základní nástroj zadáním jeho názvu skillu (např. `wizz-help`) ve vašem IDE. Nevyžaduje relaci agenta.
:::

## Přehled

| Nástroj | Typ | Účel |
| --- | --- | --- |
| [`wizz-help`](#wizz-help) | Task | Kontextové poradenství, co dělat dál |
| [`wizz-brainstorming`](#wizz-brainstorming) | Workflow | Facilitace interaktivních brainstormingových sezení |
| [`wizz-party-mode`](#wizz-party-mode) | Workflow | Orchestrace skupinových diskuzí více agentů |
| [`wizz-spec`](#wizz-spec) | Workflow | Distill any intent input into a SPEC kernel and companions, the canonical contract for downstream work (translation pending) |
| [`wizz-advanced-elicitation`](#wizz-advanced-elicitation) | Task | Iterativní zdokonalování LLM výstupu |
| [`wizz-review-adversarial-general`](#wizz-review-adversarial-general) | Task | Cynická revize hledající chybějící a chybné |
| [`wizz-review-edge-case-hunter`](#wizz-review-edge-case-hunter) | Task | Vyčerpávající analýza větvících cest pro neošetřené hraniční případy |
| [`wizz-editorial-review-prose`](#wizz-editorial-review-prose) | Task | Klinická jazyková korektura pro komunikační srozumitelnost |
| [`wizz-editorial-review-structure`](#wizz-editorial-review-structure) | Task | Strukturální editace — škrty, sloučení a reorganizace |
| [`wizz-shard-doc`](#wizz-shard-doc) | Task | Rozdělení velkých markdown souborů do organizovaných sekcí |
| [`wizz-index-docs`](#wizz-index-docs) | Task | Generování nebo aktualizace indexu dokumentů ve složce |

## wizz-help

**Váš inteligentní průvodce tím, co přijde dál.** — Zkoumá stav vašeho projektu, detekuje, co bylo uděláno, a doporučuje další povinný nebo volitelný krok.

**Použijte když:**

- Dokončili jste workflow a chcete vědět, co dál
- Jste noví v BMad a potřebujete orientaci
- Jste uvízlí a chcete kontextovou radu
- Nainstalovali jste nové moduly a chcete vidět, co je dostupné

**Jak to funguje:**

1. Skenuje projekt pro existující artefakty (PRD, architektura, stories atd.)
2. Detekuje nainstalované moduly a dostupné workflow
3. Doporučuje další kroky v pořadí priority — nejprve povinné, pak volitelné
4. Prezentuje každé doporučení s příkazem skillu a stručným popisem

**Vstup:** Volitelný dotaz v přirozeném jazyce (např. `wizz-help I have a SaaS idea, where do I start?`)

**Výstup:** Prioritizovaný seznam doporučených dalších kroků s příkazy skills

## wizz-brainstorming

**Generování různorodých nápadů prostřednictvím interaktivních kreativních technik.** — Facilitované brainstormingové sezení, které načítá osvědčené ideační metody z knihovny technik a vede vás k 100+ nápadům před organizací.

**Použijte když:**

- Začínáte nový projekt a potřebujete prozkoumat problémový prostor
- Jste uvízlí s generováním nápadů a potřebujete strukturovanou kreativitu
- Chcete použít osvědčené ideační frameworky (SCAMPER, reverzní brainstorming atd.)

**Jak to funguje:**

1. Nastaví brainstormingové sezení s vaším tématem
2. Načte kreativní techniky z knihovny metod
3. Provede vás technikou za technikou, generuje nápady
4. Aplikuje anti-bias protokol — mění kreativní doménu každých 10 nápadů
5. Produkuje append-only dokument sezení se všemi nápady organizovanými podle techniky

**Vstup:** Téma brainstormingu nebo formulace problému, volitelný kontextový soubor

**Výstup:** `brainstorming-session-{date}.md` se všemi generovanými nápady

:::note[Cíl množství]
Kouzlo se děje v nápadech 50–100. Workflow povzbuzuje generování 100+ nápadů před organizací.
:::

## wizz-party-mode

**Orchestrace skupinových diskuzí více agentů.** — Načte všechny nainstalované BMad agenty a facilituje přirozenou konverzaci, kde každý agent přispívá svou unikátní odborností a osobností.

**Použijte když:**

- Potřebujete více expertních perspektiv na rozhodnutí
- Chcete, aby agenti zpochybňovali předpoklady ostatních
- Zkoumáte složité téma překračující více domén

**Jak to funguje:**

1. Načte manifest agentů se všemi nainstalovanými osobnostmi
2. Analyzuje vaše téma a vybere 2–3 nejrelevantnější agenty
3. Agenti se střídají v přispívání, s přirozenou kříženou diskuzí a nesouhlasy
4. Rotuje účast agentů pro zajištění různorodých perspektiv
5. Ukončete pomocí `goodbye`, `end party` nebo `quit`

**Vstup:** Diskuzní téma nebo otázka, s volitelnou specifikací person

**Výstup:** Real-time multi-agentní konverzace s udržovanými osobnostmi agentů

## wizz-advanced-elicitation

**Iterativní zdokonalování LLM výstupu metodami elicitace.** — Vybírá z knihovny elicitačních technik pro systematické zlepšování obsahu více průchody.

**Použijte když:**

- LLM výstup působí povrchně nebo genericky
- Chcete prozkoumat téma z více analytických úhlů
- Zdokonalujete kritický dokument a chcete hlubší myšlení

**Jak to funguje:**

1. Načte registr metod s 5+ elicitačními technikami
2. Vybere 5 nejlépe odpovídajících metod podle typu a složitosti obsahu
3. Prezentuje interaktivní nabídku — vyberte metodu, zamíchejte nebo zobrazte vše
4. Aplikuje vybranou metodu k vylepšení obsahu
5. Znovu prezentuje možnosti pro iterativní zlepšení, dokud nevyberete „Pokračovat“

**Vstup:** Sekce obsahu k vylepšení

**Výstup:** Vylepšená verze obsahu s aplikovanými zlepšeními

## wizz-review-adversarial-general

**Cynická revize, která předpokládá existenci problémů a hledá je.** — Zaujme perspektivu skeptického, otráveného recenzenta s nulovou tolerancí pro nedbalou práci. Hledá, co chybí, ne jen co je špatně.

**Použijte když:**

- Potřebujete zajištění kvality před finalizací výstupu
- Chcete zátěžově otestovat specifikaci, story nebo dokument
- Chcete najít mezery v pokrytí, které optimistické revize přehlédnou

**Jak to funguje:**

1. Čte obsah s cynickou, kritickou perspektivou
2. Identifikuje problémy v úplnosti, správnosti a kvalitě
3. Specificky hledá, co chybí — ne jen co je přítomné a špatné
4. Musí najít minimálně 10 problémů nebo analyzuje hlouběji

**Vstup:**

- `content` (povinné) — Diff, specifikace, story, dokument nebo jakýkoli artefakt
- `also_consider` (volitelné) — Další oblasti k zvážení

**Výstup:** Markdown seznam 10+ nálezů s popisy

## wizz-review-edge-case-hunter

**Procházení každé větvící cesty a hraničních podmínek, hlášení pouze neošetřených případů.** — Čistě metodologický přístup trasování cest, který mechanicky odvozuje třídy hraničních případů.

**Použijte když:**

- Chcete vyčerpávající pokrytí hraničních případů pro kód nebo logiku
- Potřebujete doplněk k adversariální revizi (jiná metodologie, jiné nálezy)
- Revidujete diff nebo funkci pro hraniční podmínky

**Jak to funguje:**

1. Enumeruje všechny větvící cesty v obsahu
2. Mechanicky odvozuje třídy případů: chybějící else/default, nestřežené vstupy, off-by-one, přetečení aritmetiky, implicitní typová koerce, race conditions, mezery v timeoutech
3. Testuje každou cestu proti existujícím ochranám
4. Hlásí pouze neošetřené cesty — tiše zahazuje ošetřené

**Vstup:**

- `content` (povinné) — Diff, celý soubor nebo funkce
- `also_consider` (volitelné) — Další oblasti k zvážení

**Výstup:** JSON pole nálezů, každý s `location`, `trigger_condition`, `guard_snippet` a `potential_consequence`

:::note[Komplementární revize]
Spusťte obě `wizz-review-adversarial-general` a `wizz-review-edge-case-hunter` společně pro ortogonální pokrytí. Adversariální revize zachytí problémy kvality a úplnosti; hunter hraničních případů zachytí neošetřené cesty.
:::

## wizz-editorial-review-prose

**Klinická jazyková korektura zaměřená na srozumitelnost komunikace.** — Reviduje text pro problémy bránící porozumění. Aplikuje baseline Microsoft Writing Style Guide. Zachovává autorský hlas.

**Použijte když:**

- Napsali jste dokument a chcete vylepšit psaní
- Potřebujete zajistit srozumitelnost pro konkrétní publikum
- Chcete komunikační opravy bez změn stylistických preferencí

**Jak to funguje:**

1. Čte obsah, přeskakuje bloky kódu a frontmatter
2. Identifikuje komunikační problémy (ne stylistické preference)
3. Deduplikuje stejné problémy napříč více lokacemi
4. Produkuje třísloupcovou tabulku oprav

**Vstup:**

- `content` (povinné) — Markdown, prostý text nebo XML
- `style_guide` (volitelné) — Projektově specifický průvodce stylem
- `reader_type` (volitelné) — `humans` (výchozí) pro srozumitelnost/plynulost, nebo `llm` pro přesnost/konzistenci

**Výstup:** Třísloupcová markdown tabulka: Původní text | Revidovaný text | Změny

## wizz-editorial-review-structure

**Strukturální editace — navrhuje škrty, sloučení, přesuny a zhuštění.** — Reviduje organizaci dokumentu a navrhuje substantivní změny pro zlepšení srozumitelnosti a toku před jazykovou korekcí.

**Použijte když:**

- Dokument byl vytvořen z více subprocesů a potřebuje strukturální koherenci
- Chcete zkrátit dokument při zachování porozumění
- Potřebujete identifikovat porušení rozsahu nebo pohřbené kritické informace

**Jak to funguje:**

1. Analyzuje dokument proti 5 strukturním modelům (Tutorial, Reference, Explanation, Prompt, Strategic)
2. Identifikuje redundance, porušení rozsahu a pohřbené informace
3. Produkuje prioritizovaná doporučení: CUT, MERGE, MOVE, CONDENSE, QUESTION, PRESERVE
4. Odhaduje celkovou redukci ve slovech a procentech

**Vstup:**

- `content` (povinné) — Dokument k revizi
- `purpose` (volitelné) — Zamýšlený účel (např. „quickstart tutoriál“)
- `target_audience` (volitelné) — Kdo to čte
- `reader_type` (volitelné) — `humans` nebo `llm`
- `length_target` (volitelné) — Cílová redukce (např. „o 30 % kratší“)

**Výstup:** Shrnutí dokumentu, prioritizovaný seznam doporučení a odhadovaná redukce

## wizz-shard-doc

**Rozdělení velkých markdown souborů do organizovaných souborů sekcí.** — Používá nadpisy úrovně 2 jako body dělení k vytvoření složky samostatných souborů sekcí s indexem.

**Použijte když:**

- Markdown dokument narostl na nezvládnutelnou velikost (500+ řádků)
- Chcete rozložit monolitický dokument na navigovatelné sekce
- Potřebujete samostatné soubory pro paralelní editaci nebo správu LLM kontextu

**Jak to funguje:**

1. Validuje, že zdrojový soubor existuje a je markdown
2. Dělí na nadpisech úrovně 2 (`##`) do číslovaných souborů sekcí
3. Vytváří `index.md` s manifestem sekcí a odkazy
4. Vyzve vás ke smazání, archivaci nebo zachování originálu

**Vstup:** Cesta ke zdrojovému markdown souboru, volitelná cílová složka

**Výstup:** Složka s `index.md` a `01-{sekce}.md`, `02-{sekce}.md` atd.

## wizz-index-docs

**Generování nebo aktualizace indexu všech dokumentů ve složce.** — Skenuje adresář, čte každý soubor pro pochopení jeho účelu a produkuje organizovaný `index.md` s odkazy a popisy.

**Použijte když:**

- Potřebujete lehký index pro rychlé LLM skenování dostupných dokumentů
- Složka dokumentace narostla a potřebuje organizovaný obsah
- Chcete automaticky generovaný přehled, který zůstává aktuální

**Jak to funguje:**

1. Skenuje cílový adresář pro všechny neskryté soubory
2. Čte každý soubor pro pochopení jeho skutečného účelu
3. Seskupuje soubory podle typu, účelu nebo podadresáře
4. Generuje stručné popisy (3–10 slov každý)

**Vstup:** Cesta k cílové složce

**Výstup:** `index.md` s organizovanými výpisy souborů, relativními odkazy a stručnými popisy
