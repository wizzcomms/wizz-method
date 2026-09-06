# Pin, unpin and hooks

The Wizz instruction-only adaptation does not ship the upstream management runtime. `pin`, `unpin` and `hooks` are therefore not executable through this bundle.

If asked to manage them, first inspect whether the project separately installed the official Impeccable runtime. If present, consult its installed help and current official documentation and use only commands it actually supports. If absent, explain the missing capability and prepare an installation plan if requested. Do not install another runtime automatically during UI work.

UI audit and polish remain available through the bundled [command-workflows](command-workflows.md). Never report a hook or detector as active based solely on these instructions.
