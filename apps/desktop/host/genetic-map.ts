/**
 * The GRCh37 genetic map, downloaded onto this Mac when the person asks (owner, 2026-11-11, N124 A; K653).
 *
 * OneFamily doesn't bundle it: no license is stated where it's published. The app names the source, downloads
 * the file from there only after a yes, checks it against the size and SHA-256 pinned here, and keeps the
 * autosomes and X as one PLINK file in the app's own folder, with a note saying where it came from. Without
 * it, comparisons use the approximate 1 cM per Mb rule and say so.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { parsePlinkMap, type GeneticMap } from '@extantape/onefamily-core'

export const GRCH37_MAP = {
  name: 'HapMap Phase II, GRCh37 (Beagle PLINK files)',
  url: 'https://bochet.gcc.biostat.washington.edu/beagle/genetic_maps/plink.GRCh37.map.zip',
  bytes: 23_913_120,
  sha256: '8e88141345844571bc63efac6c043ee29e8ca41f26087dc51b7f1918943a077b',
  publisher: 'the Beagle genetic maps page at the University of Washington',
  madeBy: 'The HapMap Phase II map (2007), lifted to GRCh37 by Adam Auton (2010), in PLINK format by Brian Browning.',
  license: 'No license is stated on the download page.',
} as const

const CHROMOSOMES = [...Array.from({ length: 22 }, (_, i) => String(i + 1)), 'X']

export class MapError extends Error {}

const dir = (stateDir: string) => join(stateDir, 'genetic-maps', 'GRCh37')
const mapFile = (stateDir: string) => join(dir(stateDir), 'plink.GRCh37.map')
const noteFile = (stateDir: string) => join(dir(stateDir), 'SOURCE.md')

/** The files in a zip archive, by name. Only stored and deflated entries, which is all this archive uses. */
export function readZip(buf: Buffer): Map<string, Buffer> {
  let end = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break }
  if (end < 0) throw new MapError('The download isn’t a zip archive.')
  const count = buf.readUInt16LE(end + 10)
  let p = buf.readUInt32LE(end + 16)
  const files = new Map<string, Buffer>()
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new MapError('The zip archive’s directory is damaged.')
    const method = buf.readUInt16LE(p + 10)
    const packed = buf.readUInt32LE(p + 20)
    const size = buf.readUInt32LE(p + 24)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const local = buf.readUInt32LE(p + 42)
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8')
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const data = buf.subarray(start, start + packed)
    if (method === 0) files.set(name, Buffer.from(data))
    else if (method === 8) files.set(name, inflateRawSync(data))
    else throw new MapError(`${name} uses a compression this app doesn’t read.`)
    if (files.get(name)!.length !== size) throw new MapError(`${name} didn’t unpack to its stated size.`)
    p += 46 + nameLen + extraLen + commentLen
  }
  return files
}

/** Checks a downloaded archive and installs the map. Nothing is written unless every check passes. */
export function installMap(stateDir: string, archive: Uint8Array, today: string, expected: { bytes: number; sha256: string } = GRCH37_MAP): void {
  const buf = Buffer.from(archive)
  if (buf.length !== expected.bytes) throw new MapError(`The download is ${buf.length.toLocaleString()} bytes, not the expected ${expected.bytes.toLocaleString()}. Nothing was installed.`)
  const sha = createHash('sha256').update(buf).digest('hex')
  if (sha !== expected.sha256) throw new MapError('The download doesn’t match the checksum this app expects. Nothing was installed.')
  const files = readZip(buf)
  const parts = CHROMOSOMES.map((c) => {
    const f = files.get(`plink.chr${c}.GRCh37.map`)
    if (!f) throw new MapError(`The archive has no map for chromosome ${c}. Nothing was installed.`)
    return f.toString('utf8').trimEnd()
  })
  const text = parts.join('\n') + '\n'
  parsePlinkMap(GRCH37_MAP.name, text) // refuses a malformed map
  mkdirSync(dir(stateDir), { recursive: true })
  const tmp = `${mapFile(stateDir)}.partial`
  writeFileSync(tmp, text)
  writeFileSync(
    noteFile(stateDir),
    [
      '# Genetic map (GRCh37)',
      '',
      `Downloaded on ${today} from ${GRCH37_MAP.publisher}, at the person's request:`,
      GRCH37_MAP.url,
      '',
      GRCH37_MAP.madeBy,
      GRCH37_MAP.license,
      '',
      `Archive SHA-256: ${sha}`,
      'Kept here: chromosomes 1 to 22 and X, joined into plink.GRCh37.map. Delete this folder to go back to the approximate rule.',
      '',
    ].join('\n'),
  )
  renameSync(tmp, mapFile(stateDir))
}

export type MapStatus = {
  installed: boolean
  name: string
  publisher: string
  url: string
  megabytes: number
  madeBy: string
  license: string
  installedOn: string | null
}

export function mapStatus(stateDir: string): MapStatus {
  const installed = existsSync(mapFile(stateDir))
  const note = installed && existsSync(noteFile(stateDir)) ? readFileSync(noteFile(stateDir), 'utf8') : ''
  return {
    installed,
    name: GRCH37_MAP.name,
    publisher: GRCH37_MAP.publisher,
    url: GRCH37_MAP.url,
    megabytes: Math.round(GRCH37_MAP.bytes / 1_000_000),
    madeBy: GRCH37_MAP.madeBy,
    license: GRCH37_MAP.license,
    installedOn: /Downloaded on (\d{4}-\d{2}-\d{2})/.exec(note)?.[1] ?? null,
  }
}

let cached: { file: string; map: GeneticMap } | null = null

/** The installed map, or null. */
export function loadMap(stateDir: string): GeneticMap | null {
  const file = mapFile(stateDir)
  if (!existsSync(file)) return null
  if (cached?.file !== file) cached = { file, map: parsePlinkMap(GRCH37_MAP.name, readFileSync(file, 'utf8')) }
  return cached.map
}

export function removeMap(stateDir: string): void {
  rmSync(dir(stateDir), { recursive: true, force: true })
  cached = null
}

/** Downloads the archive from its publisher. */
export async function downloadArchive(fetchImpl: typeof fetch = fetch): Promise<Uint8Array> {
  const res = await fetchImpl(GRCH37_MAP.url)
  if (!res.ok) throw new MapError(`The map’s publisher answered ${res.status}. Nothing was installed.`)
  return new Uint8Array(await res.arrayBuffer())
}
