/**
 * K132: the export-coverage inventory (docs/export-coverage.md) is kept in step with the code. Every column
 * the simulator writes must appear in the document, and every column the importer needs must be a column the
 * simulator writes, so the importer can't ask for something the inventory doesn't know about.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MATCH_LIST_COLUMNS, MATCH_TREE_COLUMNS, SHARED_MATCH_COLUMNS } from '@extantape/onefamily-simulate'
import { MATCH_LIST_REQUIRED, SHARED_REQUIRED, TREE_SOURCE_COLUMNS } from '../src/index.js'

const doc = readFileSync(fileURLToPath(new URL('../../../docs/export-coverage.md', import.meta.url)), 'utf8')
const rows = new Set(doc.split('\n').filter((l) => l.startsWith('|')).map((l) => l.split('|')[1]!.trim().replace(/`/g, '')))

describe('the export coverage inventory', () => {
  it('lists every column the simulator writes, for each of the three files', () => {
    for (const c of [...MATCH_LIST_COLUMNS, ...SHARED_MATCH_COLUMNS, ...MATCH_TREE_COLUMNS]) expect(rows.has(c), c).toBe(true)
  })

  it('has no required column the simulator doesn’t write', () => {
    for (const c of MATCH_LIST_REQUIRED) expect((MATCH_LIST_COLUMNS as readonly string[]).includes(c), c).toBe(true)
    for (const c of SHARED_REQUIRED) expect((SHARED_MATCH_COLUMNS as readonly string[]).includes(c), c).toBe(true)
    for (const c of TREE_SOURCE_COLUMNS) expect((MATCH_LIST_COLUMNS as readonly string[]).includes(c), c).toBe(true)
  })

  it('says which sources it used, and that no code or binary was read', () => {
    expect(doc).toMatch(/## Sources used/)
    expect(doc).toMatch(/no code or binaries/i)
  })
})
