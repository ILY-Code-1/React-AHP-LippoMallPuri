import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { decryptConfig } from '../lib/crypto'

/**
 * Firebase is initialised entirely from the encrypted SECRET env variable.
 * No other env vars exist — SECRET decrypts to the full Firebase config object.
 */
let firebaseConfig
try {
  firebaseConfig = decryptConfig(import.meta.env.SECRET)
} catch (err) {
  // Surface a clear message instead of a cryptic Firebase init error.
  console.error(
    '[Enerlyze] Failed to load Firebase config from SECRET env.\n' +
      'Run `npm run encrypt-env` and paste the result into .env as SECRET=...\n',
    err,
  )
  throw err
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
