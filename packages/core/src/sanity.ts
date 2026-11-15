/**
 * Safeguard S7, genetic sanity across kits (ADR 0003). Run before any analysis that uses more than one kit.
 *
 * - Kit pairs: two family kits must share cM inside the observed range for the relationship the user says
 *   they have, and a close relative must appear in the other kit's match list at all.
 * - Sides: matches a kit shares with its tested mother should be on the kit's maternal side (or both), and
 *   with its tested father on the paternal side. A real disagreement rate means a side label, a kit or a
 *   stated relationship is wrong.
 *
 * Nothing is repaired. Each problem is an Issue; `assertSane` stops a run on any error. A relationship with no
 * known range is reported as not checked, never passed.
 */
import type { MatchObservation } from './model.js'
import type { Issue } from './issues.js'

/** Observed ranges in cM, Shared cM Project version 4 (2020). Only relationships with a published range. */
export const RELATIONSHIP_RANGES = {
  'parent-child': [2376, 3720],
  'full-sibling': [1613, 3488],
  'half-sibling': [1160, 2436],
  grandparent: [984, 2462],
  'aunt-uncle': [1201, 2282],
  'half-aunt-uncle': [492, 1315],
  'great-grandparent': [485, 1486],
  'first-cousin': [396, 1397],
  'half-first-cousin': [156, 1086],
  'first-cousin-once-removed': [102, 980],
  'second-cousin': [41, 592],
} as const satisfies Record<string, readonly [number, number]>

export type Relationship = keyof typeof RELATIONSHIP_RANGES | (string & {})

export type KitPair = {
  a: string
  b: string
  /** What the user says the two kits are to each other. */
  stated: Relationship
  /** cM in a's list for b: a number, null if b isn't in a's list, undefined if a's list wasn't loaded. */
  aSeesB?: number | null
  bSeesA?: number | null
}

export class SanityStop extends Error {
  constructor(public readonly issues: readonly Issue[]) {
    const errors = issues.filter((i) => i.severity === 'error')
    super(`stopped by the cross-kit check (S7): ${errors.length} problem${errors.length === 1 ? '' : 's'}. First: ${errors[0]?.message ?? 'unknown'}`)
    this.name = 'SanityStop'
  }
}

export function checkKitPairs(pairs: readonly KitPair[]): Issue[] {
  const issues: Issue[] = []
  for (const p of pairs) {
    const who = `${p.a} and ${p.b}`
    const range = (RELATIONSHIP_RANGES as Record<string, readonly [number, number]>)[p.stated]
    if (!range) {
      issues.push({ severity: 'notice', code: 'kits.unchecked', message: `${who}: no published range for "${p.stated}", so this pair isn't checked` })
      continue
    }
    const seen = [p.aSeesB, p.bSeesA].filter((v): v is number | null => v !== undefined)
    if (seen.length === 0) {
      issues.push({ severity: 'notice', code: 'kits.unchecked', message: `${who}: neither match list is loaded` })
      continue
    }
    if (seen.some((v) => v === null)) {
      issues.push({ severity: 'error', code: 'kits.not-found', message: `${who}: stated ${p.stated}, but one kit isn't in the other's match list` })
      continue
    }
    const cms = seen as number[]
    if (cms.length === 2 && Math.abs(cms[0]! - cms[1]!) > 1) {
      issues.push({ severity: 'notice', code: 'kits.lists-differ', message: `${who}: the two lists give ${cms[0]} and ${cms[1]} cM` })
    }
    const cm = Math.max(...cms)
    const [lo, hi] = range
    if (cm < lo || cm > hi) {
      issues.push({ severity: 'error', code: 'kits.out-of-range', message: `${who}: share ${cm} cM, outside ${lo} to ${hi} cM for ${p.stated}. The stated relationship or a kit is wrong.` })
    }
  }
  return issues
}

export type SideCheckOptions = {
  /** Only matches the child shares at least this much with count. Small matches are often false. Default 20. */
  minCm?: number
  /** More disagreements than this share of the counted matches is an error. Default 0.05. */
  maxDisagree?: number
  /** Fewer counted matches than this can't support a verdict. Default 20. */
  minCounted?: number
}

/** Matches the child shares with a tested parent should sit on that parent's side of the child's list. */
export function checkSides(child: readonly MatchObservation[], parent: readonly MatchObservation[], role: 'mother' | 'father', opts: SideCheckOptions = {}): Issue[] {
  const { minCm = 20, maxDisagree = 0.05, minCounted = 20 } = opts
  const expected = role === 'mother' ? 'maternal' : 'paternal'
  const opposite = role === 'mother' ? 'paternal' : 'maternal'
  const inParent = new Set(parent.map((m) => m.match))
  const parentKit = parent[0]?.kit
  const counted = child.filter((m) => inParent.has(m.match) && m.match !== parentKit && m.sharedCm >= minCm)
  const wrong = counted.filter((m) => m.side === opposite)
  const right = counted.filter((m) => m.side === expected || m.side === 'both')
  const kit = child[0]?.kit ?? 'the kit'
  if (counted.length < minCounted) {
    return [{ severity: 'notice', code: 'sides.too-few', message: `${kit}: only ${counted.length} shared matches of ${minCm} cM or more with the ${role}, so sides aren't checked` }]
  }
  const share = wrong.length / counted.length
  const summary = `${kit}: of ${counted.length} matches shared with the ${role}, ${right.length} are ${expected} or both, ${wrong.length} are ${opposite}, ${counted.length - right.length - wrong.length} unassigned`
  if (share > maxDisagree) {
    return [{ severity: 'error', code: 'sides.disagree', message: `${summary}. That's ${(share * 100).toFixed(1)}%, over the ${(maxDisagree * 100).toFixed(0)}% limit.` }]
  }
  return [{ severity: 'notice', code: 'sides.ok', message: summary }]
}

/** Stops a run if any check found an error. */
export function assertSane(issues: readonly Issue[]): void {
  if (issues.some((i) => i.severity === 'error')) throw new SanityStop(issues)
}
