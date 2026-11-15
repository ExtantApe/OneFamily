import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { crc32, deflateRawSync } from 'node:zlib'
import { afterEach, describe, expect, it } from 'vitest'
import { GRCH37_MAP, installMap, loadMap, MapError, mapStatus, readZip, removeMap } from '../host/genetic-map'
import { createHost } from '../host/handlers'

// A made-up archive shaped like the real one: one PLINK file per chromosome, some stored and some deflated.
function zip(files: Record<string, string>, deflate: (name: string) => boolean = () => false): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text)
    const method = deflate(name) ? 8 : 0
    const data = method === 8 ? deflateRawSync(raw) : raw
    const n = Buffer.from(name)
    const crc = crc32(raw)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(method, 8)
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(n.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(method, 10)
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(n.length, 28)
    central.writeUInt32LE(offset, 42)
    locals.push(local, n, data)
    centrals.push(central, n)
    offset += 30 + n.length + data.length
  }
  const cd = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(centrals.length / 2, 8); end.writeUInt16LE(centrals.length / 2, 10)
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, end])
}

const chroms = [...Array.from({ length: 22 }, (_, i) => String(i + 1)), 'X']
const files = (skip?: string) => {
  const f: Record<string, string> = { 'README.txt': 'made up' }
  for (const c of chroms) if (c !== skip) f[`plink.chr${c}.GRCh37.map`] = `${c}\t.\t0.0\t1000000\n${c}\t.\t2.0\t2000000\n${c}\t.\t10.0\t3000000\n`
  f['plink.chrX_par1.GRCh37.map'] = 'X\t.\t0.0\t1\nX\t.\t1.0\t2\n'
  return f
}
const expected = (b: Buffer) => ({ bytes: b.length, sha256: createHash('sha256').update(b).digest('hex') })

const dirs: string[] = []
const temp = () => { const d = mkdtempSync(join(tmpdir(), 'of-map-')); dirs.push(d); return d }
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

describe('the GRCh37 genetic map (N124 A, K653)', () => {
  it('reads stored and deflated zip entries', () => {
    const z = zip({ a: 'stored text', b: 'deflated text '.repeat(50) }, (n) => n === 'b')
    const out = readZip(z)
    expect(out.get('a')!.toString()).toBe('stored text')
    expect(out.get('b')!.toString()).toBe('deflated text '.repeat(50))
  })

  it('installs a checked archive with a note naming its source, and converts positions with it', () => {
    const dir = temp()
    const z = zip(files(), (n) => n.includes('chr1.'))
    installMap(dir, z, '2026-11-15', expected(z))
    const s = mapStatus(dir)
    expect(s).toMatchObject({ installed: true, installedOn: '2026-11-15', url: GRCH37_MAP.url })
    const note = readFileSync(join(dir, 'genetic-maps', 'GRCh37', 'SOURCE.md'), 'utf8')
    expect(note).toContain(GRCH37_MAP.url)
    expect(note).toContain('No license is stated')
    const map = loadMap(dir)!
    expect(map.toCm('1', 1_500_000)).toBeCloseTo(1)
    expect(map.toCm('X', 2_500_000)).toBeCloseTo(6)
    removeMap(dir)
    expect(mapStatus(dir).installed).toBe(false)
    expect(loadMap(dir)).toBeNull()
  })

  it('refuses a download with the wrong size or checksum, or a missing chromosome, and writes nothing', () => {
    const dir = temp()
    const z = zip(files())
    expect(() => installMap(dir, z, '2026-11-15', { ...expected(z), bytes: z.length + 1 })).toThrow(/bytes/)
    expect(() => installMap(dir, z, '2026-11-15', { ...expected(z), sha256: '0'.repeat(64) })).toThrow(MapError)
    const short = zip(files('7'))
    expect(() => installMap(dir, short, '2026-11-15', expected(short))).toThrow(/chromosome 7/)
    expect(existsSync(join(dir, 'genetic-maps'))).toBe(false)
  })

  it('pins the real archive', () => {
    expect(GRCH37_MAP.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(GRCH37_MAP.url.startsWith('https://')).toBe(true)
  })
})

describe('the host downloads it only after a yes', () => {
  it('refuses without confirm, installs with it, and the demo keeps the approximate rule', async () => {
    const root = temp()
    const z = zip(files())
    let calls = 0
    const h = createHost({ stateDir: join(root, 'state'), downloadMap: async () => { calls++; return z }, mapExpected: expected(z) }).handlers
    await expect(h.downloadGeneticMap({ confirm: false })).rejects.toThrow(/yes/)
    expect(calls).toBe(0)
    expect((await h.downloadGeneticMap({ confirm: true })).installed).toBe(true)
    expect(calls).toBe(1)
    await h.chooseLibrary({ path: join(root, 'lib') })
    await h.openDemo({ seed: 1 })
    const { comparisons } = await h.kits({})
    expect(comparisons[0]!.map).toMatch(/approximate/)
    expect((await h.removeGeneticMap({})).installed).toBe(false)
  })
})
