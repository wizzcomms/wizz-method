# Resolving the creative swipe file

The written analysis (`CATALOGO.md`) always ships. The 2 GB of video and image behind it never does: it is third-party material and it is binary. This file is how an agent finds the files when they exist, and what to say when they do not.

## Resolution order

1. **Read `CATALOGO.md`.** It is always available and it answers most questions on its own: composition, durations, screen formats, hook distribution, the 14 templates and which ones the 155 pieces actually use. Piece codes are `C001` through `C155`.

2. **Look for the configured path.** In order, first hit wins:
   - `_wizz/custom/config.user.toml` → `[modules.lowticket]` → `swipe_file_path` (never overwritten by the installer, so this is the durable pin)
   - `_wizz/config.user.toml` → `[modules.lowticket]` → `swipe_file_path` (written by the installer from the module prompt)
   - `_wizz/lowticket/config.yaml` → `swipe_file_path`

3. **Try the conventional path.** If no key is set, test `<project-root>/base/criativos/`. That is where the swipe file sits by convention in a project laid out this way.

4. **Decide, and say which branch you took.**
   - **Found:** you may cite a piece by code and open the actual file. Confirm the folder holds the expected pieces before promising anything from it.
   - **Not found:** work from `CATALOGO.md` alone and **say so explicitly**, in one line, e.g. "Trabalhando pela análise em CATALOGO.md; o swipe file não está apontado nesta máquina." Never imply you looked at a video you could not open.

## Pointing it at a new machine

Copy the folder, then either re-run the installer and answer the swipe file prompt, or pin it by hand:

```toml
# _wizz/custom/config.user.toml
[modules.lowticket]
swipe_file_path = "/absolute/path/to/the/swipe/file"
```

The hand-pinned file is never touched by the installer, so the value survives every update.

## What lives inside a pointed swipe file

- the pieces themselves, one file per code (`C001`…`C155`)
- `meta/cruzado.tsv`, both classification axes per piece (hook type × visual template)
- an HTML index for browsing and playback by a human

None of that is required. A complete answer can be built from `CATALOGO.md`; the files only let you show the piece instead of describing it.
