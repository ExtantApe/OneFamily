import { describe, expect, it } from 'vitest'
import { assertSane, checkKitPairs, checkSides, fittingRelationships, SanityStop, type MatchObservation, type MatchSide } from '../src/index.js'

const obs = (kit: string, match: string, cm: number, side: MatchSide = 'unassigned'): MatchObservation => ({
  service: 'planted', kit, match, name: match, sharedCm: cm, unweightedCm: cm, longestCm: Math.min(cm, 50), segments: 3, side,
  treeStatus: 'none', treeSize: null, matchDate: null, provenance: { file: 'x.csv', sha256: 'x', row: 1 } as never,
})

describe('kit pairs (S7)', () => {
  it('passes a parent and child in range, seen from both sides', () => {
    expect(checkKitPairs([{ a: 'P', b: 'C', stated: 'parent-child', aSeesB: 3440, bSeesA: 3440 }])).toEqual([])
  })
  it('stops a stated full sibling who shares parent-child cM, and a stated parent who shares sibling cM', () => {
    const issues = checkKitPairs([
      { a: 'A', b: 'B', stated: 'full-sibling', aSeesB: 3600 },
      { a: 'P', b: 'C', stated: 'parent-child', aSeesB: 1700 },
    ])
    expect(issues.map((i) => i.code)).toEqual(['kits.out-of-range', 'kits.out-of-range'])
    expect(() => assertSane(issues)).toThrow(SanityStop)
  })
  it('stops when a close relative is missing from a loaded list', () => {
    const issues = checkKitPairs([{ a: 'A', b: 'B', stated: 'first-cousin', aSeesB: null }])
    expect(issues[0]!.code).toBe('kits.not-found')
    expect(() => assertSane(issues)).toThrow(SanityStop)
  })
  it('reports a relationship with no published range as not checked, never as passed', () => {
    const issues = checkKitPairs([{ a: 'A', b: 'B', stated: 'great-aunt-uncle', aSeesB: 900 }])
    expect(issues).toEqual([expect.objectContaining({ severity: 'notice', code: 'kits.unchecked' })])
  })
  it('notes when the two lists disagree, without stopping', () => {
    const issues = checkKitPairs([{ a: 'A', b: 'B', stated: 'second-cousin', aSeesB: 120, bSeesA: 125 }])
    expect(issues.map((i) => i.code)).toEqual(['kits.lists-differ'])
    expect(() => assertSane(issues)).not.toThrow()
  })
})

describe('sides (S7)', () => {
  const mother = Array.from({ length: 40 }, (_, i) => obs('MOM', `m${i}`, 60))
  it('passes when shared matches are maternal or both', () => {
    const child = mother.map((m, i) => obs('KID', m.match, 30, i % 5 === 0 ? 'both' : 'maternal'))
    const issues = checkSides(child, mother, 'mother')
    expect(issues[0]!.code).toBe('sides.ok')
  })
  it('stops when too many shared matches sit on the paternal side', () => {
    const child = mother.map((m, i) => obs('KID', m.match, 30, i < 6 ? 'paternal' : 'maternal'))
    const issues = checkSides(child, mother, 'mother')
    expect(issues[0]!.code).toBe('sides.disagree')
    expect(() => assertSane(issues)).toThrow(SanityStop)
  })
  it('ignores small matches and declines a verdict on too few', () => {
    const child = mother.map((m) => obs('KID', m.match, 10, 'paternal'))
    expect(checkSides(child, mother, 'mother')[0]!.code).toBe('sides.too-few')
  })
  it('works for a father the same way', () => {
    const father = Array.from({ length: 30 }, (_, i) => obs('DAD', `f${i}`, 50))
    const child = father.map((m) => obs('KID', m.match, 25, 'maternal'))
    expect(checkSides(child, father, 'father')[0]!.code).toBe('sides.disagree')
  })
})

describe('what a cM fits', () => {
  it('lists every published relationship whose range holds it, and none outside', () => {
    expect(fittingRelationships(3400)).toEqual(['parent-child', 'full-sibling'])
    expect(fittingRelationships(4000)).toEqual([])
    expect(fittingRelationships(500)).toEqual(expect.arrayContaining(['great-grandparent', 'first-cousin', 'second-cousin']))
  })
})
