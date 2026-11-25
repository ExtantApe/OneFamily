# Release checklist (K152)

Nothing has been released. This is the list to work through for the first release, and for later ones. The owner decides when to release. See also `RELEASING.md`.

## State on 2026-11-25

- **No release workflow exists.** `.github/workflows/` has the CI and leak-check workflows only. A `desktop-v*` tag workflow that builds the `.dmg` and attaches it to a GitHub Release still has to be written, and it needs the signing choice below.
- **Version files** are all `0.0.0`: `apps/desktop/package.json`, `apps/desktop/src-tauri/Cargo.toml` and `apps/desktop/src-tauri/tauri.conf.json`.
- **Signing.** Not notarized, by decision. Theseus and Ariadne share one self-signed certificate that must not change. Whether OneFamily uses the same one is an owner question. It matters for the Keychain item (K370): an item tied to the signed app only keeps working across updates if the signature stays stable.
- **App icon.** `src-tauri/icons/` holds an icon from before the rename. OneFamily's icon isn't decided (docs/decisions.md, 2026-11-12). The toolbar uses the brand mark.
- **Brand copy.** `brand/oneorigin/` matches its lock, but the source in OnePhylogeny has moved ahead (`tokens.json`). Relock before release.

## Before tagging

1. All packages' tests and the app tests pass (`pnpm -r typecheck`, `pnpm -r test`).
2. Leak audit: `scripts/leak-check.sh` passes, and `scripts/leak-check-local.sh` passes on the owner's Mac (it reads private terms that live outside the repo). Check `git log --format='%ae'` shows only the noreply address.
3. `node scripts/oneorigin.mjs check` passes after the relock.
4. The by-hand test (`docs/by-hand-test.md`) is done by the owner, and every failure is fixed or recorded.
5. Update every version file and `CHANGELOG.md` (move Unreleased under the version and date).
6. README status line says what was and wasn't tested, in the owner's words.
7. `docs/test-audit.md` has a dated entry for the release commit.
8. USE-POLICY.md and the license restriction (docs/license-restriction-draft.md) have had their legal review, or the release notes say they haven't.

## Tagging and notes

1. Tag `desktop-vx.y.z` and push. CI builds the `.dmg`.
2. Release notes carry both ways past the macOS warning (wording in `RELEASING.md` and the README install section). Never suggest anything that turns off Gatekeeper for the whole Mac.
3. Check the Release has the `.dmg` only, with no build logs or source maps with paths in them.

## After

1. Download the `.dmg` from the Release on a Mac that hasn't built the app, and run section A of the by-hand test.
2. Record the release in docs/decisions.md and the ops store.
