# ADR 0003: Safeguards against wrong results

Status: accepted, 2026-11-10

Each safeguard is enforced in code and covered by tests. A promise that's only written down is a bug.

| # | Safeguard | Enforced by |
| --- | --- | --- |
| S1 | Blindness | The unblind gate (ADR 0002) |
| S2 | Planted test families | Simulated families with known answers. Engine changes must find the planted answers before any real data is used. |
| S3 | Same inputs, same results | Fixed, recorded random seeds; reference runs are compared exactly |
| S4 | Import checks fail loudly | Expected columns and types, values in range (shared cM 6 to 3,600; longest segment no bigger than the total), known date formats |
| S5 | Count reconciliation | Unique IDs; previous export + new − gone = this export; the row count equals the count the service showed, when recorded |
| S6 | Spot checks against the source | A sample of matches compared with the service's own pages, where the terms register allows it |
| S7 | Genetic sanity across kits | Family kits share cM in range for their DNA relationship; side assignments agree across kits. Built in `sanity.ts` (2026-11-15): out-of-range pairs, missing close relatives and more than 5% of shared matches on the wrong side stop the run; relationships with no published range are reported as not checked. Enforced since 2026-11-15 (K655): `phaseWithParent` and `rebuildFromDescendants` measure the raw kits first and stop unless the parent and child share parent-child cM and the children share full-sibling cM; a relationship with no range can't be relied on there. The Kits screen lists what each measured pair fits. Any later analysis that combines kits must call `assertSane` first |
| S8 | Stability report | A run stops for review if more than a few percent of placed people change lines. Built 2026-11-15 (K408): `compareRuns` and `assertStable` in `@extantape/onefamily-analysis`. Labels are matched by overlap, so renumbering isn't change. A line is the side-split path to two levels; more than 5% of the people placed in both runs changing line stops the run. Deeper levels and groups are reported, not judged. Under 50 people placed in both runs gets no verdict, and says so. The app keeps one run per kit so far, so nothing in it calls this yet; a check that replaces a kit's export must |
| S9 | Claims checked against data | Every match cited in a theory is checked against the stored observations |
| S10 | People decide conclusions | A theory's status changes only with the user's approval, which is logged |
| S11 | Backups and rebuild check | The cache is backed up before imports; a full rebuild from the library must equal the live cache |
| S12 | Provenance stamp | Every output carries the engine version, the input checksums and the seeds |

Unknown stays unknown: a match that doesn't clearly fit one line is "unplaced", never guessed.
