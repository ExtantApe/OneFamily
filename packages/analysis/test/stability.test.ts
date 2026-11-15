import { describe, expect, it } from 'vitest'
import { assertStable, clusterKit, compareRuns, SeededRandom, StabilityStop, type ClusterRun } from '../src/index.js'
import { plantedKit } from './planted.js'

/** A made-up run: `paths[i]` is match i's side-split path. */
const run = (paths: (string | null)[], kit = 'K'): ClusterRun => ({
  engine: { name: '@extantape/onefamily-analysis', version: '0.1.0' },
  kit,
  inputs: [],
  settings: {} as ClusterRun['settings'],
  matches: paths.map((path, i) => ({ match: `m${i}`, group: `G${path ?? 'x'}`, stability: 1, path })),
  excluded: [],
  splits: [],
})
const base = Array.from({ length: 200 }, (_, i) => ['M.1.1', 'M.1.2', 'M.2', 'P.1', 'P.2'][i % 5]!)

describe('the stability report between runs (S8)', () => {
  it('finds nothing changed between a run and itself', () => {
    const r = compareRuns(run(base), run(base))
    expect(r).toMatchObject({ verdict: 'stable', compared: 200, share: 0, changed: [] })
    expect(r.groupsAri).toBe(1)
  })

  it('treats a renumbering as no change: branches are matched by who is in them', () => {
    const swapped = base.map((p) => p.replace(/^M\.1/, 'M.X').replace(/^M\.2/, 'M.1').replace(/^M\.X/, 'M.2'))
    expect(compareRuns(run(base), run(swapped)).changed).toEqual([])
  })

  it('stops when more than 5% of the people placed in both runs change line, and passes at 5% or less', () => {
    const move = (n: number) => base.map((p, i) => (i < n * 5 && p === 'P.1' ? 'P.2' : p))
    const few = compareRuns(run(base), run(move(10)))
    expect(few.changed).toHaveLength(10)
    expect(few.verdict).toBe('stable')
    expect(() => assertStable(few)).not.toThrow()
    const many = compareRuns(run(base), run(move(11)))
    expect(many.verdict).toBe('stop')
    expect(many.changed[0]).toEqual({ match: 'm3', before: 'P.1', after: 'P.2' })
    expect(() => assertStable(many)).toThrow(StabilityStop)
    expect(() => assertStable(many)).toThrow(/11 of 200 .*5\.5%/)
  })

  it('judges lines to two levels by default and reports deeper changes without stopping', () => {
    const deep = base.map((p, i) => (p === 'M.1.1' && i < 100 ? 'M.1.2' : p))
    const r = compareRuns(run(base), run(deep))
    expect(r.verdict).toBe('stable')
    expect(r.levels.find((l) => l.depth === 3)!.changed).toBe(20)
    expect(compareRuns(run(base), run(deep), { depth: 3 }).verdict).toBe('stop')
  })

  it('lists people newly placed and no longer placed, and leaves unsure paths out of the count', () => {
    const after = base.map((p, i) => (i === 0 ? null : i === 1 ? 'M.?' : p))
    const r = compareRuns(run([...base, null]), run([...after, 'P.1']))
    expect(r.noLongerPlaced).toEqual(['m0', 'm1'])
    expect(r.newlyPlaced).toEqual(['m200'])
    expect(r.compared).toBe(198)
  })

  it('declines a verdict on too few people, and refuses runs of different kits', () => {
    expect(compareRuns(run(base.slice(0, 20)), run(base.slice(0, 20))).verdict).toBe('too-few')
    expect(() => compareRuns(run(base, 'A'), run(base, 'B'))).toThrow(/different kits/)
  })

  it('a planted kit rerun with a few matches gone stays stable', async () => {
    const pk = await plantedKit(1, 0, 0.7)
    const before = clusterKit(pk.imported.observations, pk.imported.links)
    const rng = new SeededRandom(5)
    const gone = new Set(rng.shuffle(before.matches.map((m) => m.match)).slice(0, 3))
    const after = clusterKit(pk.imported.observations.filter((o) => !gone.has(o.match)), pk.imported.links.filter((l) => !gone.has(l.a) && !gone.has(l.b)))
    // This family is small: 45 people are placed two levels deep.
    const r = compareRuns(before, after, { minCompared: 20 })
    expect(r.verdict).toBe('stable')
    expect(r.noLongerPlaced.every((m) => gone.has(m))).toBe(true)
  })
})
