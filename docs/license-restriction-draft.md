# Use restriction: draft text for the license

**DRAFT, 2026-11-25 (task K136). For the owner and a legal review. Nothing here is in force.** `LICENSE` is unchanged: PolyForm Noncommercial 1.0.0, with a `Required Notice` line that already carries a short draft restriction. This file is the longer wording to review before the first release.

## What the owner decided

From `USE-POLICY.md` (2026-11-09 and 2026-11-11): no use by or for law enforcement, except investigative genetic genealogy by an appropriately sanctioned lab, and identifying unknown remains through an accredited lab or a nonprofit. Identifying suspects is ruled out, even through a lab. Wildlife agencies may work on animal and wildlife cases only.

## Draft wording

> **Additional use restriction.** In addition to the terms of the PolyForm Noncommercial License 1.0.0, you may not use the software, or let anyone else use it for you, to support the work of a law-enforcement agency or to identify a suspect in a crime. This does not prevent:
>
> 1. investigative genetic genealogy carried out by an appropriately sanctioned laboratory, for any purpose other than identifying a suspect;
> 2. identifying unknown human remains, through an accredited laboratory or a nonprofit organization; or
> 3. work by a wildlife agency on animal or wildlife cases.
>
> The use policy in `USE-POLICY.md` explains these terms in plain words and is part of this notice.

## Points for the legal review

- **Can the restriction sit in a Required Notice at all?** PolyForm's Required Notice line is meant for copyright and attribution. A use restriction may need to be a separate paragraph above the license text, and the result may no longer be the unmodified PolyForm license. If so, the README's "PolyForm Noncommercial" wording should say "with an additional restriction", as it does now.
- **Do the exceptions weaken the restriction?** "Appropriately sanctioned" and "accredited" need a definition someone could check.
- **OnePedigree and the other OneOrigin apps.** A shared policy changes their licenses too. Their maintainers decide that first (docs/decisions.md, 2026-11-11).
- **Enforcement.** A local app can't see who uses it. The restriction gives grounds to act on a known breach, and the app's first-launch question records an answer. Neither stops anyone.

## To apply it later

Replace the `Required Notice: Use restriction` line in `LICENSE` with the agreed text, change `USE_POLICY_VERSION` in `apps/desktop/host/protocol.ts` from `draft 2026-11-10` to the reviewed version, and update `USE-POLICY.md`'s status line. `apps/desktop/test/use-policy.test.ts` expects the draft markers today and will need the same edit.
