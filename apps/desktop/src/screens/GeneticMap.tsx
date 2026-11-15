import { useEffect, useState } from 'react'
import type { MapStatus } from '../../host/protocol'
import { call } from '../api'

/**
 * The GRCh37 genetic map card (owner, 2026-11-11, N124 A). Names the source before anything is downloaded,
 * downloads only after a yes, and can remove the map again.
 */
export function GeneticMapCard({ onChange }: { onChange?: () => void }) {
  const [status, setStatus] = useState<MapStatus | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    call('geneticMap').then(setStatus, (e: Error) => setError(e.message))
  }, [])

  const run = async (f: () => Promise<MapStatus>) => {
    setBusy(true)
    setError(null)
    try {
      setStatus(await f())
      onChange?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (!status) return error ? <p role="alert">{error}</p> : null
  return (
    <section className="ol-card" aria-labelledby="genetic-map">
      <h2 id="genetic-map" style={{ marginTop: 0 }}>
        Genetic map
      </h2>
      {status.installed ? (
        <>
          <p>
            Using the {status.name} map, downloaded {status.installedOn ? `on ${status.installedOn} ` : ''}from {status.publisher}. Kits whose raw files are on
            GRCh37 are measured with it. The made-up demo always uses the approximate rule, because its positions are invented.
          </p>
          <button type="button" disabled={busy} onClick={() => void run(() => call('removeGeneticMap'))}>
            Remove the map
          </button>
        </>
      ) : (
        <>
          <p>
            Comparisons use an approximate rule of 1 cM per million base pairs. A published genetic map measures segments more accurately. OneFamily doesn’t
            include one, but it can download the usual GRCh37 map onto this Mac for you.
          </p>
          {!confirming ? (
            <button type="button" disabled={busy} onClick={() => setConfirming(true)}>
              Download the map…
            </button>
          ) : (
            <div className="ol-confirm" role="group" aria-label="Confirm the map download">
              <p>
                This downloads about {status.megabytes} MB from {status.publisher}:
                <br />
                <code style={{ wordBreak: 'break-all' }}>{status.url}</code>
              </p>
              <p className="ol-hint">
                {status.madeBy} {status.license} The file is checked against a fixed checksum before it’s used, and nothing about you or your DNA is sent.
              </p>
              <div className="ol-row">
                <button type="button" className="ol-primary" disabled={busy} onClick={() => void run(() => call('downloadGeneticMap', { confirm: true }))}>
                  {busy ? 'Downloading…' : 'Yes, download it'}
                </button>
                <button type="button" autoFocus disabled={busy} onClick={() => setConfirming(false)}>
                  Not now
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
