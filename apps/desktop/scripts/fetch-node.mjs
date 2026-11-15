#!/usr/bin/env node
// Puts the Node runtime the app ships with into src-tauri/binaries (ADR 0007, K338).
// Downloads the official build from nodejs.org, checks it against the SHA-256 pinned here, and keeps only
// bin/node and Node's LICENSE. Skips the download when the right file is already there.
//
//   node scripts/fetch-node.mjs            this Mac's architecture
//   node scripts/fetch-node.mjs --all      both Apple silicon and Intel
//
// To move to a newer Node: change VERSION and both hashes, taken from https://nodejs.org/dist/<version>/SHASUMS256.txt
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const VERSION = 'v26.13.0'
export const BUILDS = {
  arm64: { triple: 'aarch64-apple-darwin', sha256: '6f5b3187d9df9fc007e881167905bc7d69ad26450ddc377c83d63256a2495b6e' },
  x64: { triple: 'x86_64-apple-darwin', sha256: '8bd636bc981a92e1ab930c02340eece2076eb1aaf94d14e421cdeeddc1292298' },
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src-tauri', 'binaries')
const sha = (buf) => createHash('sha256').update(buf).digest('hex')

async function fetchOne(arch) {
  const { triple, sha256 } = BUILDS[arch]
  const target = join(out, `node-${triple}`)
  const stamp = `${target}.stamp`
  if (existsSync(target) && existsSync(stamp) && readFileSync(stamp, 'utf8').trim() === `${VERSION} ${sha256}`) {
    console.log(`Node ${VERSION} for ${arch} is already in place`)
    return
  }
  const name = `node-${VERSION}-darwin-${arch}`
  const url = `https://nodejs.org/dist/${VERSION}/${name}.tar.xz`
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`nodejs.org answered ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const got = sha(buf)
  if (got !== sha256) throw new Error(`Checksum mismatch for ${name}: expected ${sha256}, got ${got}. Nothing was installed.`)
  const work = mkdtempSync(join(tmpdir(), 'onefamily-node-'))
  try {
    const tarball = join(work, `${name}.tar.xz`)
    writeFileSync(tarball, buf)
    execFileSync('tar', ['-xJf', tarball, '-C', work, `${name}/bin/node`, `${name}/LICENSE`])
    mkdirSync(out, { recursive: true })
    copyFileSync(join(work, name, 'bin', 'node'), target)
    chmodSync(target, 0o755)
    copyFileSync(join(work, name, 'LICENSE'), join(out, 'node-LICENSE'))
    writeFileSync(stamp, `${VERSION} ${sha256}\n`)
    console.log(`Node ${VERSION} for ${arch} checked and placed at ${target}`)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.platform !== 'darwin') throw new Error('OneFamily for Mac bundles the macOS build of Node; run this on a Mac.')
  const arches = process.argv.includes('--all') ? Object.keys(BUILDS) : [process.arch]
  for (const a of arches) {
    if (!BUILDS[a]) throw new Error(`No Node build pinned for ${a}`)
    await fetchOne(a)
  }
}
