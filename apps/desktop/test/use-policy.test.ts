/** K136: the use policy, the first-launch choices and the license notice say the same thing. Read-only checks on the repo's own files. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { USE_KINDS, USE_POLICY_VERSION } from '../host/protocol'

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../../../${p}`, import.meta.url)), 'utf8')

describe('the use policy', () => {
  const policy = read('USE-POLICY.md')
  const license = read('LICENSE')
  const screen = read('apps/desktop/src/screens/FirstLaunch.tsx')

  it('is marked as a draft in the policy, the recorded version and the license notice', () => {
    expect(policy).toMatch(/Status: draft/)
    expect(USE_POLICY_VERSION).toMatch(/^draft /)
    expect(license.split('\n').find((l) => l.startsWith('Required Notice: Use restriction'))).toMatch(/draft .*awaiting legal review.*USE-POLICY\.md/)
  })

  it('keeps the license text itself PolyForm Noncommercial 1.0.0, with the copyright notice first', () => {
    expect(license.split('\n')[0]).toMatch(/^Required Notice: Copyright 2026 EXTANT APE/)
    expect(license).toContain('# PolyForm Noncommercial License 1.0.0')
  })

  it('offers on first launch exactly the kinds of use the policy allows, and never law enforcement', () => {
    const offered = screen.split("value: '").slice(1).map((part) => part.split("'")[0]!)
    expect(offered.sort()).toEqual([...USE_KINDS].sort())
    expect(offered.join(' ')).not.toMatch(/law|police|suspect/)
    const allowed = policy.split('## Not allowed')[0]!
    expect(allowed).toMatch(/Personal family research/)
    expect(allowed).toMatch(/someone else/)
    expect(allowed).toMatch(/sanctioned lab/)
    expect(allowed).toMatch(/Wildlife agencies/)
  })

  it('says outright that the app can’t police use, so the screen promises nothing more', () => {
    expect(policy).toMatch(/can.t police its own use/)
    expect(screen).toMatch(/doesn’t watch how/)
  })
})
