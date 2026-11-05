# Verification record

Date: 2026-11-05
Harness profile: `desktop`
Installed bundle: `dsh-deep-work@0.3.1`

## Static checks

```text
node --check index.js
node --check client.js
node --check verify.js
npm test
```

All pass. The test suite covers:

- bundle and client manifest fields
- preset declaration in `cordis.patch.yml`
- host skill registration through a stub Cordis context
- client locale and slot registration through a stub loader
- deliverable type detection for DOCX, PDF, HTML, and empty files
- `verify_deliverable` registration and execution through a stub filesystem

## Installation

`plugin_manager install_bundle` returned `application: applied` with no warnings
for `dsh-deep-work@0.3.1`.

Host inspection confirmed the preset row is present:

```text
include:preset-deep-work
  name: @deepseek-ai/dsh-agent-preset
  status: schema
```

The live preset roster was read through `agentPresets.list()` and returned:

```text
standard   order 1
ptc        order 2
design     order 3
minimal    order 3
cordis     order 4
deep-work  order 4.5   name: Deep Work
```

The Deep Work skill was registered into the skill catalog and is visible as
`deep-work`.

The `dsh-deep-work/verify` package subpath resolves from the active profile and
exports `apply`, `inject`, `inspectDeliverable`, and `registerVerifyTool`.

## Client UI

The client module was exercised with the module-loader contract and registers:

- `sidebar.footer.action` as `deep-work`
- `conversation.hero.options` as `deep-work`
- `conversation.session.header.actions` as `deep-work`
- the `deepWork` locale namespace

The running Electron process predates the client bundle installation. The
client bundle graph is composed at application boot, so the three visible
actions require a full quit and reopen of DeepSeek Harness. After that restart,
the live slot inspection should show the registrations.

## Manual acceptance checks after restart

1. Open a new session and confirm **Deep Work** is in the mode selector.
2. Confirm **Deep Work** appears in the sidebar footer.
3. Open a blank session and confirm **Deep Work** appears in the new-session row.
4. Start a Deep Work session and confirm the header badge appears.
5. Ask for a small `.docx` deliverable and confirm `verify_deliverable` runs.
6. Confirm the right-sidebar **Deliverables** and **Files** tabs show the result.
