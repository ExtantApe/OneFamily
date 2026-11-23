/**
 * OnePedigree documents for the theory page. Pure, so both the host (when it writes the demo's recorded
 * tree) and the window use it, and tests can check it.
 */
import type { PedigreeDocument } from '@extantape/onepedigree-core'
import type { ParentKind, TheoryDocument } from '../host/protocol'

export type TreePerson = {
  id: string
  given: string
  surname: string
  sex: 'M' | 'F'
  birthYear: number
  deathYear: number | null
  /** Parents as recorded. */
  father: string | null
  mother: string | null
  /** How each parent is recorded, when it isn't biological (adoptive, legal, social and so on). Kept on the link, so an
   * adoptive parent never counts in genetics. */
  fatherKind?: ParentKind
  motherKind?: ParentKind
}

const link = (individual: string, role: 'father' | 'mother', kind: ParentKind | undefined) => ({ individual, role, ...(kind && kind !== 'biological' ? { kind } : {}) })

const sexWord = (s: 'M' | 'F') => (s === 'M' ? 'male' : 'female')

/**
 * The focal person's ancestors through recorded parents, up to `generations` back (the focal person is
 * generation 0). Parents outside that range are left out, never invented.
 */
export function recordedTree(people: readonly TreePerson[], focal: string, generations = 4): PedigreeDocument {
  const byId = new Map(people.map((p) => [p.id, p]))
  if (!byId.has(focal)) throw new Error(`${focal} isn't in the tree`)
  const keep = new Map<string, number>()
  const walk = (id: string | null, g: number) => {
    if (!id || g > generations || !byId.has(id)) return
    if ((keep.get(id) ?? Infinity) <= g) return
    keep.set(id, g)
    const p = byId.get(id) as TreePerson
    walk(p.father, g + 1)
    walk(p.mother, g + 1)
  }
  walk(focal, 0)
  const individuals = [...keep.keys()].map((id) => {
    const p = byId.get(id) as TreePerson
    const parents = [
      ...(p.father && keep.has(p.father) ? [link(p.father, 'father', p.fatherKind)] : []),
      ...(p.mother && keep.has(p.mother) ? [link(p.mother, 'mother', p.motherKind)] : []),
    ]
    return {
      id: p.id,
      label: `${p.given} ${p.surname}`,
      sex: sexWord(p.sex),
      parentage: parents.length ? { parents } : null,
      data: { born: p.birthYear, ...(p.deathYear ? { died: p.deathYear } : { living: true }) },
    }
  })
  return { schemaVersion: 1, individuals }
}

/**
 * The recorded tree with one father replaced by candidates, in OnePedigree's `uncertainParents` shape.
 * The recorded father stays in the document as a candidate, and the other man (with his parents, if given)
 * is added. The odds are placeholders until the analysis that computes them exists; they sum to 1. `basis` says where the
 * candidates came from, and OnePedigree shows it after them.
 */
export function withCandidateFathers(
  recorded: PedigreeDocument,
  q: { child: string; recordedFather: string; biologicalFather: string },
  extra: readonly TreePerson[],
  odds: { recorded: number; other: number } = { recorded: 0.5, other: 0.5 },
  basis = 'planted in the demo family; odds not computed yet',
): TheoryDocument {
  if (odds.recorded <= 0 || odds.other <= 0 || odds.recorded + odds.other > 1 + 1e-9) throw new Error('each candidate needs odds above 0, and together at most 1')
  if (q.recordedFather === q.biologicalFather) throw new Error('the two candidates must be different people')
  const child = recorded.individuals.find((i) => i.id === q.child)
  if (!child) throw new Error(`${q.child} isn't in the recorded tree`)
  const fatherRef = child.parentage?.parents.find((p) => p.individual === q.recordedFather)
  if (!fatherRef) throw new Error(`${q.recordedFather} isn't recorded as a parent of ${q.child}`)

  const have = new Set(recorded.individuals.map((i) => i.id))
  const added = recordedTree(extra, q.biologicalFather, 1).individuals.filter((i) => !have.has(i.id))
  const individuals: TheoryDocument['individuals'] = [...recorded.individuals, ...added].map((i) => {
    const base = {
      id: i.id,
      label: i.label ?? null,
      sex: i.sex ?? null,
      parentage: i.parentage ? { parents: i.parentage.parents.map((p) => ({ individual: p.individual, role: p.role ?? null, ...(p.kind ? { kind: p.kind } : {}) })) } : null,
      ...(i.data ? { data: { ...i.data } } : {}),
    }
    if (i.id !== q.child) return base
    return {
      ...base,
      parentage: {
        // The father slot moves from "recorded" to "one of these": a candidate can't also be a recorded parent.
        parents: base.parentage!.parents.filter((p) => p.individual !== q.recordedFather),
        uncertainParents: [
          {
            role: fatherRef.role ?? 'father',
            candidates: [
              { individual: q.recordedFather, probability: odds.recorded },
              { individual: q.biologicalFather, probability: odds.other },
            ],
            basis,
          },
        ],
      },
    }
  })
  return { schemaVersion: 1, individuals }
}

/** The same document with every label passed through `label`, for the privacy switch. */
export function relabel<D extends { individuals: readonly { label?: string | null }[] }>(doc: D, label: (s: string) => string): D {
  return { ...doc, individuals: doc.individuals.map((i) => (i.label ? { ...i, label: label(i.label) } : i)) }
}
