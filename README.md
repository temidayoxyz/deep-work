# Deep Work

A knowledge-work mode for DeepSeek Harness. Deep Work turns a session into a small
delivery studio: understand the brief, make a plan, gather evidence, produce the
artifact, verify it, and hand back a file — not just a chat answer.

## What it is for

- assignments and essays
- research briefs and market scans
- reports and proposals
- Word documents, spreadsheets, slide decks, and PDFs
- analysis of existing files
- structured plans, SOPs, and recurring reports

## What it adds

- A **Deep Work** agent preset with a delivery-oriented persona.
- The **deep-work** skill, a repeatable protocol for evidence-backed knowledge work.
- A workspace task protocol under `.deep-work/` so long tasks can be resumed.
- A deliverables convention: `deliverables/` in the session workspace.
- Verification rules for `.docx`, `.xlsx`, `.pptx`, `.pdf`, HTML, and data files.

## Install

Install the directory with the Harness plugin manager:

```text
plugin_manager install_bundle D:\Codebase\dsh-plugins\deep-work
```

The bundle declares a `deep-work` preset. Start a new session, choose **Deep Work**
from the mode selector, select a workspace, and describe the deliverable.

## Use

Examples:

> Read the notes in `notes/` and write a five-page assignment as a formatted `.docx`.
> Include a short reference list and verify the document opens.

> Analyse `sales.xlsx`, identify the three strongest trends, and produce a
> nine-slide presentation with charts and speaker notes.

> Research the market in `brief.md` and produce a report plus a one-page summary.
> Cite every factual claim and flag anything you could not verify.

For a substantial task, Deep Work keeps its working state in `.deep-work/`:

```text
.deep-work/
  task.md          # objective, constraints, state
  plan.md          # current plan
  sources.md       # source ledger and verification notes
deliverables/
  final.docx
```

Short requests may not need a task file. Long or multi-session requests should.

## Boundaries

- Deep Work produces local files. It does not provide a cloud worker that
  continues after the Harness process exits.
- External side effects — sending email, publishing, paying, deleting, or sharing —
  still require the user's explicit approval.
- Web research uses the deployment's configured web providers.
- Browser automation and computer use are optional providers in Harness, not
  requirements of this plugin.

## License

MIT
