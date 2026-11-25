# S3 status: OneFamily first release

Audited 2026-11-25 against `origin/main` at 0a2763d, then built on branch `s3-first-release`. Task text is as written around 2026-11-10, so each line says what the code does now.

## K132: export coverage for our own exporter (clean room)

**Partly done.** `docs/export-coverage.md` lists every column of the three file shapes (match list, shared matches, match trees) with what the simulator writes and what the importer does with it, and a test keeps the document in step with the code. It's clean room: no code or binaries of the other program were read.

Missing: the program's own public documentation. Searches on 2026-11-25 found none, so the inventory rests on our simulator's column lists and our importer, and says so. An exporter that writes these shapes from the extension isn't built, by decision (docs/decisions.md, 2026-11-09: off for Ancestry until a partnership). Owner item: name the public documentation page to use.

## K136: use policy, first-launch declaration, license restriction draft

**Done, pending the legal review the owner already planned.**
- Use policy: `USE-POLICY.md` (draft, owner decisions of 2026-11-09 and 2026-11-11).
- First-launch declaration: step 2 of 3 in `apps/desktop/src/screens/FirstLaunch.tsx`, recorded once in the decisions log by `declareUse` (`apps/desktop/host/handlers.ts`), with no law-enforcement option; tested in `apps/desktop/test/host.test.ts`.
- License restriction: a short draft already sits in `LICENSE`'s Required Notice. Added `docs/license-restriction-draft.md` with the longer wording and the points for review. `LICENSE` is not changed.
- Added `apps/desktop/test/use-policy.test.ts`: the policy, the screen's choices, the recorded version and the license notice agree, and all say draft.

## K137: OneOrigin brand from a single source, plus the OneFamily mark

**Done, except two items that wait on decisions.**
- The brand copy is locked (`brand/oneorigin.lock`, CI check) and already held OneFamily's mark.
- New: the app toolbar now shows that mark, read from `brand/oneorigin/marks/` through an alias, with no second copy. `brand/README.md` was out of date and is fixed.
- Waiting: the app icon and tile aren't decided (docs/decisions.md, 2026-11-12), so `src-tauri/icons/` is unchanged. The source in OnePhylogeny has moved ahead of the lock (`tokens.json`); relocking needs the owner's choice of source commit.
- Not tested: how the mark looks on screen.

## K370: Keychain item tied to the signed app, recovery-copy button

**Recovery button: done. Keychain tie: not done, needs a decision.**
- The host side already existed (`backupKeyRecovery`, `keychainStore.recoveryCopy`, tests in `keychain.test.ts` and `host.test.ts`).
- New: a Backup key section on the Backups screen, shown when a destination is cloud-synced. It fetches the copy only when asked, shows it on screen, and hides it again. It never goes to the library, a log or the clipboard. Tested: `needsKeyRecovery`, and the host refusing a copy with no key store. Not tested: the button on screen, and the real Keychain.
- Not done: the item is made through Apple's `security` tool, so its access list trusts that tool and not the app (stated in `keychain.ts`). Tying it to the signed app means the app's own signed code, not the `security` tool, has to read and write the item, and it depends on which certificate signs the app. It uses the shared certificate (owner, 2026-11-25).

## K410: the by-hand test

**Checklist written, not run.** `docs/by-hand-test.md`, numbered, made-up data and a throwaway library only. It's the owner's to run.

## K152: first release with a leak audit and Gatekeeper notes

**Prepared, not released.**
- `docs/release-checklist.md`, with the state of everything a release needs.
- README gains an Install section with both ways past Gatekeeper.
- Leak audit, 2026-11-25: `scripts/leak-check.sh` passed (246 files, with the private-terms file on this Mac). Every commit author and committer is the noreply address or GitHub's. No `.env`, key or certificate files are tracked. No secrets pattern found. The only absolute home paths are made-up example paths in a library test. The only tracked binaries are app icons. `scripts/leak-check-local.sh` wasn't run, because it reads the owner's private Genealogy folder, which this session doesn't open; the owner runs it on release day.
- Missing: the release workflow for `desktop-v*` tags, the version bump from 0.0.0, and the app icon (signing: the shared certificate, 2026-11-25).

## Owner questions

Answered 2026-11-25: the same certificate as Theseus and Ariadne, and K132 kept as written with no exporter until a partnership (docs/decisions.md). The brand relock is done (944e204). Still open:

1. **Run `scripts/leak-check-local.sh` yourself before release.** Recommended: yes, and say if it finds anything.

Next for the Software session: the release workflow (K152) and tying the Keychain item to the signed app (K370), together, since both rest on the certificate.
