# ADR 0024 — Apache-2.0, and a public release that starts from one commit

Status: Accepted — founder decisions, 2026-11-04
Date: 2026-11-04
Amends: ADR 0023 §4 ("The license stays MIT"). Nothing else in ADR 0023
changes.
Relates: ADR 0008 (the transparency ledger), ADR 0016, ADR 0017 (the floors
and the layers), `CONTRIBUTING.md`, `docs/RELEASE_FRESH_HISTORY.md`,
`scripts/release/`.

## Context

The repository has always been private. On 3 November 2026 the plan was to
make it public as it was, with its full history, under MIT (ADR 0023 §4).
On 4 November 2026 the founder made three decisions that change that plan:

1. The license is Apache-2.0.
2. The public repository starts from one release commit, `v0.1.0`: a
   reviewed snapshot of `main`, with no earlier history. The private
   repository, with its full history, is kept as the archive.
3. From the release on, all work happens in the public repository. It is the
   upstream. The private repository becomes a read-only archive. Nothing syncs
   or mirrors between them.

The readers of the public release are professionals and partner institutions
deciding whether to contribute to the platform, carry it out, or keep
developing it.

## Decisions

### 1. Apache-2.0

`LICENSE` is the Apache License 2.0 text, word for word. The name-and-mark
notice that used to sit inside `LICENSE` moves to a new `NOTICE` file, so
GitHub can recognise the license. `package.json` says `Apache-2.0`.

Why Apache-2.0 rather than MIT:

- **An explicit patent grant (§3).** Each contributor grants a patent
  license for their contribution, and loses it if they sue over the work.
  Some partners' lawyers prefer this, or require it. MIT says nothing about
  patents.
- **A clear trademark line (§6).** The license grants no right to use the
  OneRhythm name or the 1R mark. That fits the name policy in the vision
  (section 11): anyone may fork the code, and only a deployment that keeps
  the floors may use the name. `NOTICE` says this plainly and claims no more
  than §6 already gives.
- **Contributions come in on the same terms (§5).** With the DCO sign-off
  (`CONTRIBUTING.md`), this is enough. There is no separate contributor
  license agreement.

### 2. Why changing the license is clean now

Relicensing is cheapest before anyone else's code is in the project
(ADR 0023 §4). Two facts make it clean today:

- **Nothing was ever published under MIT.** The repository has been private
  since it was created, so no one received the code under MIT.
- **Every commit so far is the founder's own.** The author check, run on
  4 November 2026 over the full, unshallowed history (179 commits, every
  branch):

  ```
  $ git log --all --format='%an <%ae>' | sort -u
  Claude <noreply@anthropic.com>
  Matthew Adams <matthew@vt-infinite.com>
  daftpixie <matthew@vt-infinite.com>
  ```

  "Claude" commits were made by an AI assistant working in the founder's own
  sessions, at the founder's direction. There are no outside contributors.

The founder is not a lawyer, and neither is anyone who wrote this record.
Counsel may confirm the reasoning above.

### 3. The public history starts at the release commit

`scripts/release/export.sh` builds the public repository from a chosen
commit of `main`. It copies the tree without `.git`, leaves out the paths
listed in `scripts/release/EXCLUDE` (each with its reason), writes a fresh
`docs/SESSION_LOG.md`, and makes one signed-off commit, tagged `v0.1.0`. It
then runs the checks inside the export. It never pushes; the founder does.
It can be run again against whatever `main` is at release time.

**What stays private, and why:**

- **The earlier commits.** Their messages and metadata carry working detail
  that helps no outside reader: links to private AI sessions, the order in
  which mistakes were made and fixed, and personal details that the private
  checklist lists one by one. The decisions those commits carried are in the
  ADRs, the plans and the PRD, which are public.
- **The working session log** (`docs/SESSION_LOG.md`). It is the internal
  diary of each working session. The public repository gets a fresh log whose
  first entry is the release.
- **The founder's flip checklist** (`docs/OPEN_SOURCE_CHECKLIST.md`). It lists
  what going public would reveal about the founder, item by item, so
  publishing it would defeat it.
- **The transparency ledger** (`transparency/`), by default, pending the
  founder's decision. See "The ledger tension" below.

What goes public: the code, the tests, the guards, the database migrations,
the ADRs, the PRD and its amendments, the brand guide, the vision, and
`.claude/` (agents, hooks, rules, skills and plans). They are how this
project is built and reviewed, and a partner should be able to check them.

### 4. The repository that is public is the upstream

After the release, every change is made in the public repository, by pull
request, under the DCO and Apache-2.0. The private repository is archived
read-only. There is no sync, mirror or back-port tooling, and none is
planned: two live copies would drift, and a reader could not tell which one
is true.

## What this costs

**The public record starts at the release.** A reader cannot run `git log`
back to the first commit, see when a test was written before its code, or
follow a decision through its review rounds. That is a real loss for a
project that says "we would rather be checked than trusted."

What survives in public:

- every decision, in `docs/adr/`, including the ones that were later
  corrected, with their status notes;
- the plan for each phase, in `.claude/plans/`;
- the PRD and its three amendments;
- ADR 0013, which names the tests that once proved nothing.

What is kept, privately: the full history, in the archive. VT Infinite, Inc.
intends to keep it read-only and not delete it. It holds no member data. If
it ever did, a member's right to delete (privacy floor item 8) would come
first.

**The ledger tension.** ADR 0008 made the repository itself the transparency
ledger, and `transparency/README.md` says that git history, not our word, is
the audit trail. A fresh-history release resets that history. So
`transparency/` is left out of the release by default. If the founder decides
to publish it, its README must first say that the public audit trail starts
at the release commit, and that the earlier history is in the private
archive. Until then, CLAUDE.md's line holds: open books are intended, and not
yet public.

## Consequences

- `CONTRIBUTING.md` says this repository is the upstream, that
  contributions come in under Apache-2.0 §5, and that the DCO sign-off rule
  starts at the release commit.
- The DCO GitHub App is installed on the public repository before it is made
  public (`docs/RELEASE_FRESH_HISTORY.md`).
- Future working sessions, and their pull requests, happen in the public
  repository.
- Links into the private repository's history (commit SHAs, pull request
  numbers before the release) mean nothing to an outside reader. The ADRs
  that cite them keep them as historical references.

## Alternatives considered

- **Publish the full history.** The most checkable option. Not chosen: the
  history carries private session links and personal detail, and rewriting
  179 commits to remove them would produce a history that is neither the
  real one nor a clean one.
- **Rewrite history with a filter tool, then publish.** Rejected for the
  same reason, and because a rewritten history looks complete when it isn't.
- **Stay with MIT.** Simpler, and widely understood. Not chosen because it
  has no patent grant and no trademark line.
- **Keep both repositories live, with a mirror.** Rejected: drift, and two
  places to report a problem.
