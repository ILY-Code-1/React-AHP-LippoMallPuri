/**
 * Seed script — run once after Firebase is configured.
 *
 *   npm run seed
 *   npm run seed -- admin@enerlyze.com "Nama Admin" MyPassword123
 *
 * It performs two things:
 *   1. Seeds the four fixed AHP criteria into `criteria_enerlyze`.
 *   2. Creates the initial admin user in `users_enerlyze` (password hashed).
 *
 * The Firebase config is read from the SECRET line in `.env`.
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, doc, setDoc, getDocs, addDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { decryptConfig, hashPassword } from '../src/lib/crypto.js'
import { CRITERIA } from '../src/constants/criteria.js'
import { COLLECTIONS } from '../src/constants/collections.js'

/* ── Read SECRET from .env ──────────────────────────────────────────────── */
const readSecret = () => {
  let env
  try {
    env = readFileSync('.env', 'utf8')
  } catch {
    console.error('✗ .env file not found. Create it first (see .env.example).')
    process.exit(1)
  }
  const line = env.split(/\r?\n/).find((l) => l.trim().startsWith('SECRET='))
  if (!line) {
    console.error('✗ SECRET= not found in .env.')
    process.exit(1)
  }
  return line.slice(line.indexOf('=') + 1).trim()
}

const main = async () => {
  const [emailArg, nameArg, passArg] = process.argv.slice(2)
  const adminEmail = emailArg || 'admin@enerlyze.com'
  const adminName = nameArg || 'Administrator'
  const adminPass = passArg || 'Admin1234@'

  const config = decryptConfig(readSecret())
  const app = initializeApp(config)
  const db = getFirestore(app)

  /* 1. Criteria ----------------------------------------------------------- */
  console.log('→ Seeding AHP criteria...')
  for (const c of CRITERIA) {
    await setDoc(doc(db, COLLECTIONS.CRITERIA, c.key), {
      key: c.key,
      code: c.code,
      name: c.name,
      rank: c.defaultRank,
    })
    console.log(`  ✓ ${c.code} — ${c.name} (rank ${c.defaultRank})`)
  }

  /* 2. Initial admin ------------------------------------------------------ */
  console.log('→ Creating initial admin user...')
  const usersCol = collection(db, COLLECTIONS.USERS)
  const existing = await getDocs(query(usersCol, where('email', '==', adminEmail)))
  if (!existing.empty) {
    console.log(`  • Admin "${adminEmail}" already exists — skipped.`)
  } else {
    await addDoc(usersCol, {
      name: adminName,
      email: adminEmail,
      password: hashPassword(adminPass),
      role: 'admin',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    console.log(`  ✓ Admin created — ${adminEmail} / ${adminPass}`)
  }

  console.log('\n✓ Seed complete. You can now log in to Enerlyze.')
  process.exit(0)
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
