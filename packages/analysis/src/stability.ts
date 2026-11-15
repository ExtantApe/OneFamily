/**
 * Safeguard S8, the stability report between runs (ADR 0003). A new run of the same kit, after a check or a
 * full rerun, should leave most people where they were. If more than a few percent of the people placed in
 * both runs change line, the run stops for review: something in the data or the method moved, and every
 * finding built on the old lines needs another look.
 *
 * Labels aren't comparable as they stand: groups are numbered by size and side splits are numbered within
 * each side, so a renumbering alone would look like everyone moving. Each level's labels in the old run are
 * matched one to one with the new run's labels they overlap most, and a person changed line only if their
 * new label isn't the match of their old one.
 *
 * Lines are compared to `depth` levels of the side-split path (default 2: side, then branch). Deeper levels
 * are reported too, as notices: third-level splits are often borderline, and the method's own reruns
 * differed there. Groups are reported as a notice with their adjusted Rand index.
 */
import type { ClusterRun } from './cluster.js'
import { adjustedRandIndex } from './ari.js'

export type StabilityOptions = {
  /** Path levels that define a line. Default 2. */
  depth?: number
  /** More changes than this share of the people placed in both runs stops the run. Default 0.05. */
  maxChanged?: number
  /** Fewer people placed in both runs than this can't support a verdict. Default 50. */
  minCompared?: number
}

export type LevelReport = { depth: number; compared: number; changed: number; share: number; ari: number }

export type StabilityReport = {
  kit: string
  verdict: 'stable' | 'stop' | 'too-few'
  depth: number
  maxChanged: number
  /** Placed in both runs at `depth`. */
  compared: number
  changed: { match: string; before: string; after: string }[]
  share: number
  /** Placed before but not now, and the other way round. */
  noLongerPlaced: string[]
  newlyPlaced: string[]
  levels: LevelReport[]
  groupsAri: number
  message: string
}

export class StabilityStop extends Error {
  constructor(public readonly report: StabilityReport) {
    super(`stopped by the stability check (S8): ${report.message}`)
    this.name = 'StabilityStop'
  }
}

const cut = (path: string, depth: number) => path.split('.').slice(0, depth).join('.')
/** A path counts at a depth only if it goes that deep and has no unsure step ("?"). */
const placedAt = (path: string | null, depth: number): string | null => {
  if (!path) return null
  const parts = path.split('.')
  if (parts.length < depth || parts.slice(0, depth).some((p) => p.includes('?'))) return null
  return cut(path, depth)
}

/** One-to-one matching of old labels to new ones by overlap, largest overlaps first. Ties go to the label sorted first. */
function matchLabels(pairs: readonly [string, string][]): Map<string, string> {
  const counts = new Map<string, number>()
  for (const [a, b] of pairs) counts.set(`${a}\u0000${b}`, (counts.get(`${a}\u0000${b}`) ?? 0) + 1)
  const ranked = [...counts].map(([k, n]) => { const [a, b] = k.split('\u0000') as [string, string]; return { a, b, n } })
    .sort((x, y) => y.n - x.n || (x.a < y.a ? -1 : x.a > y.a ? 1 : x.b < y.b ? -1 : x.b > y.b ? 1 : 0))
  const map = new Map<string, string>()
  const used = new Set<string>()
  for (const { a, b } of ranked) if (!map.has(a) && !used.has(b)) { map.set(a, b); used.add(b) }
  return map
}

function level(before: Map<string, string | null>, after: Map<string, string | null>, depth: number) {
  const pairs: [string, string, string][] = []
  for (const [m, p] of before) {
    const a = placedAt(p, depth)
    const b = placedAt(after.get(m) ?? null, depth)
    if (a && b) pairs.push([m, a, b])
  }
  const map = matchLabels(pairs.map(([, a, b]) => [a, b]))
  const changed = pairs.filter(([, a, b]) => map.get(a) !== b).map(([match, a, b]) => ({ match, before: a, after: b }))
  const ari = adjustedRandIndex(new Map(pairs.map(([m, a]) => [m, a])), new Map(pairs.map(([m, , b]) => [m, b])))
  return { compared: pairs.length, changed, ari }
}

export function compareRuns(before: ClusterRun, after: ClusterRun, opts: StabilityOptions = {}): StabilityReport {
  const { depth = 2, maxChanged = 0.05, minCompared = 50 } = opts
  if (before.kit !== after.kit) throw new Error(`the two runs are for different kits (${before.kit}, ${after.kit})`)
  const b = new Map(before.matches.map((m) => [m.match, m.path]))
  const a = new Map(after.matches.map((m) => [m.match, m.path]))
  const main = level(b, a, depth)
  const maxDepth = Math.max(depth, ...[...b.values(), ...a.values()].map((p) => (p ? p.split('.').length : 0)))
  const levels: LevelReport[] = []
  for (let d = 1; d <= maxDepth; d++) {
    const l = d === depth ? main : level(b, a, d)
    levels.push({ depth: d, compared: l.compared, changed: l.changed.length, share: l.compared ? l.changed.length / l.compared : 0, ari: l.ari })
  }
  const noLongerPlaced = [...b].filter(([m, p]) => placedAt(p, depth) && !placedAt(a.get(m) ?? null, depth)).map(([m]) => m).sort()
  const newlyPlaced = [...a].filter(([m, p]) => placedAt(p, depth) && !placedAt(b.get(m) ?? null, depth)).map(([m]) => m).sort()
  const bg = new Map(before.matches.map((m) => [m.match, m.group]))
  const ag = new Map(after.matches.map((m) => [m.match, m.group]))
  const groupsAri = adjustedRandIndex(bg, ag)
  const share = main.compared ? main.changed.length / main.compared : 0
  const verdict = main.compared < minCompared ? 'too-few' : share > maxChanged ? 'stop' : 'stable'
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`
  const message =
    verdict === 'too-few'
      ? `only ${main.compared} people are placed in both runs, fewer than ${minCompared}, so stability isn't judged`
      : `${main.changed.length} of ${main.compared} people placed in both runs changed line (${pct(share)}, limit ${pct(maxChanged)}, lines to ${depth} levels)`
  return { kit: before.kit, verdict, depth, maxChanged, compared: main.compared, changed: main.changed, share, noLongerPlaced, newlyPlaced, levels, groupsAri, message }
}

/** Stops unless the new run is stable against the old one. "Too few" doesn't stop, but says so. */
export function assertStable(report: StabilityReport): void {
  if (report.verdict === 'stop') throw new StabilityStop(report)
}
