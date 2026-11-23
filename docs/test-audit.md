# Test audit

Kept by this repo's owning session (Genealogy), per `~/Code/CLAUDE.md`, "Test self-audits". Newest first.

## 2026-11-23: 14-day audit, after the Theory documents (K678) and the contrast fixes
- Promises since 2026-11-10: the cross-kit check refuses mixed kits in phasing and rebuilding (S7); the stability report between runs (S8); the GRCh37 genetic map only after a yes, checked against a pinned size and checksum; both candidate fathers as branches on the Theory chart; recorded parent kinds kept so an adoptive link never counts in genetics, and a basis on the candidate slot (K678); privacy masking of names, years and places; Node shipped inside the app.
- Covered: cross-kit by packages/core/test/sanity.test.ts and packages/connectors/test/raw-extras.test.ts; stability by packages/analysis/test/stability.test.ts; the map by apps/desktop/test/genetic-map.test.ts ("refuses without confirm", "refuses a download with the wrong size or checksum … and writes nothing"); branches, kinds and basis by apps/desktop/test/logic.test.ts; masking by logic.test.ts, host.test.ts and extension.test.ts. 73 app tests and every package suite pass.
- Gaps added: parent kinds and basis (logic.test.ts, "keeps a recorded parent kind…", added with K678).
- Gaps skipped (and why): apps/desktop/scripts/fetch-node.mjs has no test. It runs at build time only, checks the download against a pinned checksum, and the built app's own Node was run by hand (e5c93b6). The control outline, focus ring, Reduce motion and hairline cards are styling: contrast was measured, and there's nothing to assert in a unit test. Nobody has looked at them on screen.

## 2026-11-10: first full audit (253 tests)

**Promises checked:** the safeguards S1–S12 (ADR 0003), the terms register (ADR 0004), the library and backups (ADR 0005), the extension's security model (ADR 0009), the use policy, and privacy mode.

**Covered:**
- **S1 blindness:**
  - The importer seals tree files and tree-source columns while a kit is blind.
  - The app's theory page needs a recorded unblind first.
  - Privacy names never read trees while a kit is blind.
- **S2 planted families:**
  - Simulated sharing falls in published ranges.
  - Planted answers are in the DNA.
  - Clustering, painting, phasing and the hypothesis engine each find them.
- **S3 reproducibility:** identical output from the same seed, for the simulator, clustering (also with shuffled input) and the hypothesis engine.
- **S4, S5 import checks:** columns, ranges, encoding, duplicates, counts and cross-file references, each one refusing the whole import. This covers match lists, raw DNA in five layouts, and collected pages.
- **S11 rebuild check:** a cache that drifts on disk is found and rebuilt. Frozen exports that are changed, deleted or added to are reported.
- **S12 provenance:** each record carries its file, the file's SHA-256 and its row; clustering stamps its inputs and settings.
- **Terms register:**
  - Real files load.
  - Misspelled or missing verdicts fail loudly.
  - Every real service is refused for automation, labels and collection.
  - Real Ancestry match lists are refused.
- **Library and backups:**
  - The decisions log refuses an edit or a missing line.
  - Encryption round-trips; a wrong key fails.
  - Cloud folders need a key.
  - Restores never overwrite.
  - The two-backup rule steps down one confirmation at a time.
  - Keychain keys are tested with a pretend Keychain.
- **Extension:**
  - Framing.
  - Origin checks in the app and the native host.
  - The fixed command list.
  - Grants: once, session, expiry, end now.
  - The daily cap.
  - Stop at a challenge or sign-in page.
  - No storage APIs.
  - A run's end reported once.
- **Use policy:** law enforcement can't be recorded as a use. A minor's GEDmatch kit needs a second confirmation.
- **Privacy:**
  - Stand-ins are consistent, saved and reloaded, never a real library word, and keep the name's shape.
  - Years and places are masked.
  - Summaries and due messages carry no names.

**Gaps added today:**
- A frozen export with a file removed or a file added is reported. Before this, only a changed file was tested.
- A recent full run means no yearly rerun is due, even when the last export is old.

**Gaps skipped, and why:**
- **S6, spot checks against a service's own pages:** they need automated visits to real services, which the terms register refuses. Revisit with a partnership.
- **S7, genetic sanity across family kits:** built 2026-11-15 in `packages/core/src/sanity.ts`, covered by `packages/core/test/sanity.test.ts` (9 tests): pairs in and out of range both ways, a missing close relative, an unranged relationship reported as not checked, lists that disagree, sides that agree and disagree for a mother and a father, small matches ignored, and too few to judge. Since 2026-11-15 (K655) it guards phasing and rebuilding: `packages/connectors/test/raw-extras.test.ts` shows phasing stops on a stranger and on a grandparent stated as parent, and rebuilding stops on a wrong other parent and on half siblings; `fittingRelationships` is covered in core, and the Kits screen's list in the host test. There are no combined runs in the app yet, so there's nothing else to guard.
- **Theory chart, both candidate fathers (K337):** 2026-11-15, `apps/desktop/test/logic.test.ts` checks that a theory document drawn with OnePedigree's `uncertainParents: 'branches'` shows both the recorded and the candidate father, each joined by an uncertain line. The screen's radio switch itself is covered only by the typecheck; it hasn't been clicked in the built app.
- **Bundled Node (K338):** 2026-11-15, checked by hand: `tauri build --bundles app`, then the app's own `Contents/MacOS/node` ran `host.mjs` under `env -i` (no PATH) and answered a `status` request. That run found the chunk and `node:sqlite` faults, now fixed. Not automated: CI doesn't build the Mac app yet, and a unit test of the download script would only re-check the pinned hash. Worth adding a CI step that runs the built helper once the Mac build moves to CI.
- **Genetic map download (K653):** 2026-11-15, `apps/desktop/test/genetic-map.test.ts` (5 tests): stored and deflated zip entries; install writes a note naming the source and converts positions; a wrong size, a wrong checksum or a missing chromosome writes nothing; the host refuses without a yes and calls the downloader only once after it; the demo keeps the approximate rule. The real archive was checked by hand once, not in CI, to keep CI off the network. The card hasn't been clicked in the built app.
- **S8, the stability report between runs:** built 2026-11-15 (K408), covered by `packages/analysis/test/stability.test.ts` (7 tests): a run against itself, renumbered branches, 10 of 200 moved passes and 11 stops, deeper changes reported but not judged at the default depth, newly placed and no longer placed, too few to judge, different kits refused, and a planted rerun with matches removed. On real data it compared the original method's run of the first finished kit with OneFamily's: 1.9% changed line, stable. "Too few" doesn't stop a run; it's reported, like S7's side check.
- **S9, claims checked against the data:** theories aren't stored as data yet. Filed as a task.
- **S10, the owner approves theory status changes:** no theory editing exists yet. It's part of S9's task.
- **Native-only behaviour:** the Mac notification, the menu item, the folder picker, the real Keychain, and the extension inside Chrome. These need the running app or the owner's Chrome, so they're listed for a by-hand test before the first release.
- **Real match data (K332):** 2026-11-15, the first finished family kit's real Genealogy Assistant export went through `importGenealogyAssistant` and `clusterKit` from the built packages, by a script kept with the data outside the repo. Every match, shared-match link and grouped match agreed with the original run; groups had an adjusted Rand index of 0.980 against it, the side split was identical and the second level 96.9% the same. The third level differed more, as the original method's own rerun did. S7 passed on the family kits in that list. Nothing from it is in the repo. Still untested on real data: raw DNA files and the app's screens (the app can't load a real library yet).
