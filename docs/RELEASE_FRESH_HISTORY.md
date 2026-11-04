# The first public release — the founder's runbook

This is how OneRhythm goes public: as a new repository that starts from one
release commit, `v0.1.0`, under Apache-2.0. The current repository, with its
full history, becomes the private archive. The reasons are in
[ADR 0024](adr/0024-apache-2-and-fresh-history-release.md).

Only the founder does these steps. They are GitHub, Railway and Supabase
settings, not code. A working session can run step 2 for you, and nothing
else here.

**Before you start, all of these are done:**

- the landing build is deployed to Railway from the private repository, and
  you have reviewed the live page (`docs/DEPLOY_RAILWAY.md`);
- the docs are final, and merged to `main`;
- every CI check is green on `main`.

**Do not share the landing page's address until step 11 is done.** Its
"Open source code on GitHub" and vision links point at
`github.com/daftpixie/onerhythm`, and a stranger sees a 404 until that
repository is public.

---

## 1. Merge the release-prep pull request

Merge with CI green. Don't merge with a red check.

About the **"Supabase Preview"** check: it is a GitHub app, not part of this
repository's CI, and it fails on `main` with `relation "profiles" already
exists`. It is a dashboard setting, not a code problem. It is not one of the
required checks (`lint-typecheck-test`, `db`, `landing`). Step 7 deals with
it.

## 2. Build the release commit

On a machine with git, Node 22, npm and [gitleaks](https://github.com/gitleaks/gitleaks):

```bash
git checkout main && git pull
scripts/release/export.sh main ../onerhythm-release
```

Or ask a session to run it and show you the output. The script:

- copies the tree at `main` into the new folder, minus the paths in
  `scripts/release/EXCLUDE`, and writes a fresh session log;
- stops if any link points at a left-out file;
- makes one commit, signed off by you, with a `Co-Authored-By: Claude` line;
- tags it `v0.1.0`;
- runs the checks inside the export: npm ci, typecheck, lint, the test
  suites (also in landing mode), the seven guards, gitleaks on the tree and
  on the new history, and greps for session links, `ccr-` branch names and
  `TODO(founder)`;
- prints the commit, the file count, the results, and the push command.

**It never pushes.** If any check fails, don't push. Fix the cause in the
private repository, merge, and run it again. It can be run as many times as
you need, against whatever `main` is.

Read the `TODO(founder)` hits it lists. Each one is a decision still yours.

## 3. Rename the private repository

GitHub → `daftpixie/onerhythm` → Settings → General → Repository name →
for example `onerhythm-archive`.

GitHub redirects the old name to the renamed repository **until a new
repository takes the old name**. Step 4 does exactly that, so after step 4
the old links open the new public repository, not the archive.

Keep the archive **private**.

## 4. Create the new, empty repository

GitHub → New repository → owner `daftpixie`, name `onerhythm`:

- **Private** for now;
- no README, no license, no `.gitignore` (the release commit has its own).

## 5. Push the release commit and tag

Run the push command `export.sh` printed. It looks like this:

```bash
cd ../onerhythm-release
git remote add origin git@github.com:daftpixie/onerhythm.git
git push -u origin main
git push origin v0.1.0
```

## 6. Turn on the repository settings

In the new repository:

- **Private vulnerability reporting:** Settings → Code security → enable.
  `SECURITY.md` names it as the first channel.
- **Branch protection on `main`:** Settings → Rules → Rulesets (or
  Branches). Require a pull request, require the CI checks
  `lint-typecheck-test`, `db` and `landing` to pass, and block force pushes
  and deletion. The checks appear in the list after CI has run once.
- **Dependabot alerts:** Settings → Code security → enable.
- **The DCO app:** install the DCO GitHub App on this repository. It checks
  every pull request for the `Signed-off-by:` line that `CONTRIBUTING.md`
  asks for. The rule starts at the release commit, which is signed off.
- **Description, website and topics,** for example:
  - description: "A peer-support community for people living with cardiac
    arrhythmia, and the people who care for them. Not medical advice.";
  - website: `https://onerhythm.org`;
  - topics: `peer-support`, `arrhythmia`, `accessibility`, `wcag`, `expo`,
    `react-native`, `supabase`, `privacy`.
- **Issues: on.** The templates in `.github/ISSUE_TEMPLATE/` turn off blank
  issues and show the 988 crisis link first.
- **Discussions: off.** A public forum is a support space, and this
  repository is not one.

## 7. Keep the Supabase GitHub integration away

- **Don't connect** the Supabase GitHub integration to the new repository.
- **On the archive,** disconnect it, or turn off its production deploys.
  That integration is what runs the failing "Supabase Preview" check.
- Leave it off until hosted Supabase is set up properly and launch gate G1
  (ADR 0021) is met.
- Before any `db push`, look at what the hosted database already holds. It
  has at least one stray table (`docs/PRODUCTION_READINESS.md` 1.4), and the
  preview failure says a `profiles` table exists there too. Drop the stray
  tables or reset the project first.

## 8. Point Railway at the new repository

Railway → the landing service → Settings → Source → connect
`daftpixie/onerhythm`, branch `main`.

- The service variables stay as they are: `EXPO_PUBLIC_SITE_MODE=landing`
  and nothing else. No Supabase variables.
- Redeploy, then run the checks in `docs/DEPLOY_RAILWAY.md` §7.

## 9. The real-names search, on the export

Run the names search once more, with the real names you have in mind, on
the **export**, not the archive. It is the tree that goes public:

```bash
cd ../onerhythm-release
git log --all -p | grep -niE "name one|name two|name three" | head
git grep -niE "name one|name two|name three" | head
```

Replace the placeholders with the names. If anything turns up, fix it in
the archive, merge, and go back to step 2. A force-push to the new
repository is fine at this point, because nobody else has it yet.

## 10. Check the license, then make it public

- On the repository's front page, GitHub should show **"Apache License
  2.0"** in the sidebar. If it shows "Other" or "NOASSERTION", stop: the
  `LICENSE` file is not the plain license text.
- Settings → General → Danger Zone → Change visibility → **Public**.
  GitHub asks you to type the repository name.

Once public, it can be cloned and forked, and that cannot be taken back.

## 11. Re-check the landing page

In a private browser window, signed out of GitHub:

- open `https://onerhythm.org/` and tap **Open source code on GitHub**. It
  should open the new repository, not a 404;
- tap **Read the vision document on GitHub**. It should open
  `docs/vision/OneRhythm_Vision.md`.

Only then share the address.

## 12. From now on

- All work happens in the public repository. Future working sessions open
  their pull requests there, and those pull requests are public.
- Archive the old repository: Settings → General → Danger Zone → Archive
  this repository. It becomes read-only. Keep it private, and don't delete
  it: it holds the full history (ADR 0024).
- There is no sync or mirror between the two, and none is planned.

## Still yours to decide

- Whether `transparency/` goes public. The default is no (ADR 0024, "The
  ledger tension").
- Google Workspace: confirm its data processing terms are accepted in the
  Admin console, and set the contact mailbox's retention
  (`docs/privacy/subprocessor-inventory.md`).
- Railway's logs and terms, recorded in the same inventory before the URL is
  shared.
- When to run the export: after the Railway deploy, your review of the live
  page, and the final docs.
