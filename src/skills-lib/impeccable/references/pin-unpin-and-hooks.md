# Pin/unpin and hooks management commands

Load this file when the user invokes `pin`, `unpin`, or `hooks` (with any argument). Covers: creating/removing standalone command shortcuts, and managing the design detector hook that auto-runs after direct UI file edits.

## Pin / Unpin

**Pin** creates a standalone shortcut so `{{command_prefix}}<command>` invokes `{{command_prefix}}impeccable <command>` directly. **Unpin** removes it. The script writes to every harness directory present in the project.

```bash
node {{scripts_path}}/pin.mjs <pin|unpin> <command>
```

Valid `<command>` is any command from the table above. Report the script's result concisely. Confirm the new shortcut on success, relay stderr verbatim on error.

## Hooks

`{{command_prefix}}impeccable hooks <on|off|status|ignore-rule|ignore-file|ignore-value|reset>` manages the design detector hook for this project. The hook auto-runs the detector after direct UI file edits and surfaces findings as system reminders. Full flow is in [reference/hooks.md](reference/hooks.md); load it when the user invokes `{{command_prefix}}impeccable hooks` with any argument.
