import { layoutSync, normalizePedigree, projectPedigree } from '@extantape/onepedigree-core'
import { PedigreeExplorer } from '@extantape/onepedigree-react'
import { EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TheoryResult } from '../../host/protocol'
import { call } from '../api'
import { relabel } from '../pedigree'
import { ErrorBox, Icon, useNames } from '../ui'

export function TheoryScreen({ theory, onTheory, dark }: { theory: TheoryResult | null; onTheory: (t: TheoryResult | null) => void; dark: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { show } = useNames()

  if (!theory) return <p>This library has no recorded family tree to show yet.</p>
  if (theory.blind)
    return (
      <section className="ol-card" aria-labelledby="blind-h">
        <h2 id="blind-h" style={{ marginTop: 0 }}>
          <Icon of={EyeOff} /> {show(theory.name)}’s kit is blind
        </h2>
        <p>
          OneFamily keeps family trees sealed until you choose to look, so your matches are grouped from the DNA before a tree can nudge them. While a kit is
          blind, nothing reads its trees, notes or ancestor hints.
        </p>
        <p>Unblinding is recorded in your library’s decisions log, with the time. It can’t be taken back: the log keeps what you saw.</p>
        <ErrorBox error={error} onDismiss={() => setError(null)} />
        {!confirming ? (
          <button type="button" className="ol-primary" onClick={() => setConfirming(true)}>
            Unblind this kit…
          </button>
        ) : (
          <div className="ol-confirm" role="group" aria-label="Confirm unblinding">
            <p>Unblind {show(theory.name)}’s kit and show the recorded family tree?</p>
            <div className="ol-row">
              <button
                type="button"
                onClick={async () => {
                  setConfirming(false)
                  try {
                    onTheory(await call('unblind', { kit: theory.kit }))
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Yes, unblind and record it
              </button>
              <button type="button" className="ol-primary" autoFocus onClick={() => setConfirming(false)}>
                Keep it blind
              </button>
            </div>
          </div>
        )}
      </section>
    )
  return <OpenTheory theory={theory} dark={dark} />
}

function OpenTheory({ theory, dark }: { theory: Extract<TheoryResult, { blind: false }>; dark: boolean }) {
  const { show } = useNames()
  const label = (id: string) => show(theory.theory.individuals.find((i) => i.id === id)?.label ?? id)
  const [drawn, setDrawn] = useState<'candidates' | 'recorded'>('candidates')
  const focal = theory.recorded.individuals.find((i) => !theory.recorded.individuals.some((j) => j.parentage?.parents.some((p) => p.individual === i.id)))?.id
  const view = useMemo(() => {
    if (!focal) return null
    // With candidates: the theory document, each candidate father drawn as his own branch (OnePedigree's `branches`).
    const source = drawn === 'candidates' ? theory.theory : theory.recorded
    const doc = normalizePedigree(relabel(source, show))
    const projection = projectPedigree(doc, { focalId: focal, view: 'pedigree', ancestorDepth: 4, uncertainParents: 'branches' })
    return { projection, layout: layoutSync(projection) }
  }, [theory.recorded, theory.theory, focal, show, drawn])
  const slot = theory.theory.individuals.find((i) => i.id === theory.question.child)?.parentage?.uncertainParents?.[0]

  return (
    <>
      <p className="ol-banner">
        <strong>Placeholder theory.</strong> This page shows where theories will go. The question below comes from the demo’s planted answers, not from an
        analysis: the analysis that finds it from the DNA, with odds, isn’t built yet.
      </p>
      <section className="ol-card" aria-labelledby="q-h">
        <h2 id="q-h" style={{ marginTop: 0 }}>
          Who is {label(theory.question.child)}’s father?
        </h2>
        <p>The recorded tree names one man. The demo family was made with a different biological father. Both are candidates:</p>
        <ul>
          {(slot?.candidates ?? []).map((c) => (
            <li key={c.individual}>
              {label(c.individual)}: {c.individual === theory.question.recordedFather ? 'the recorded father' : 'another man, with his own family'}. Odds:
              not computed yet.
            </li>
          ))}
        </ul>
        <fieldset className="ol-row" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ol-hint">The chart shows</legend>
          <label>
            <input type="radio" name="theory-drawn" value="candidates" checked={drawn === 'candidates'} onChange={() => setDrawn('candidates')} /> both
            candidate fathers, side by side
          </label>
          <label>
            <input type="radio" name="theory-drawn" value="recorded" checked={drawn === 'recorded'} onChange={() => setDrawn('recorded')} /> the tree as
            recorded
          </label>
        </fieldset>
      </section>
      {view ? (
        <PedigreeExplorer
          projection={view.projection}
          layout={view.layout}
          title={drawn === 'candidates' ? `Family tree of ${show(theory.name)}, with both candidate fathers` : `Recorded family tree of ${show(theory.name)}`}
          theme={dark ? 'midnight' : 'classic'}
          height="32rem"
        />
      ) : (
        <p>The recorded tree has no starting person to draw from.</p>
      )}
    </>
  )
}
