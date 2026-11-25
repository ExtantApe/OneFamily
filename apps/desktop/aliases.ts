import { fileURLToPath } from 'node:url'

/** The sibling packages, read from source in dev and tests, so nothing needs building first. */
const src = (pkg: string) => fileURLToPath(new URL(`../../packages/${pkg}/src/index.ts`, import.meta.url))
export const packageAliases = {
  /** The locked OneOrigin brand copy: the app's marks are read from here, so there's one source (K137). */
  '@brand': fileURLToPath(new URL('../../brand/oneorigin', import.meta.url)),
  '@extantape/onefamily-core': src('core'),
  '@extantape/onefamily-connectors': src('connectors'),
  '@extantape/onefamily-library': src('library'),
  '@extantape/onefamily-simulate': src('simulate'),
  '@extantape/onefamily-analysis': src('analysis'),
}
