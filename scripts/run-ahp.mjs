/**
 * Run AHP for the last 3 completed months and persist results to Firestore.
 *
 *   npm run ahp           → runs Feb, Mar, Apr (last 3 completed months)
 *   npm run ahp -- 2026-02 → runs only the given month(s)
 *
 * Mirrors src/services/ahpService.runAndSaveAHP but uses a Node-initialized
 * Firebase (the app's config module reads import.meta.env, unavailable here).
 * The criteria pairwise matrix is persisted via serializeMatrix() so Firestore
 * never receives a nested array.
 *
 * It overwrites any existing result for a month (deletes first, then writes).
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, doc, getDocs, setDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { decryptConfig } from '../src/lib/crypto.js'
import { COLLECTIONS } from '../src/constants/collections.js'
import { CRITERIA } from '../src/constants/criteria.js'
import { runAHP, serializeMatrix } from '../src/lib/ahp.js'
import { prevMonthKey, monthKeyRange, formatMonthKey } from '../src/lib/format.js'

const readSecret = () => {
  let env
  try {
    env = readFileSync('.env', 'utf8')
  } catch {
    console.error('✗ .env file not found.')
    process.exit(1)
  }
  const line = env.split(/\r?\n/).find((l) => l.trim().startsWith('SECRET='))
  if (!line) {
    console.error('✗ SECRET= not found in .env.')
    process.exit(1)
  }
  return line.slice(line.indexOf('=') + 1).trim()
}

const ahpIdOf = (month) => `AHP-${month}`

const main = async () => {
  const config = decryptConfig(readSecret())
  const app = initializeApp(config)
  const db = getFirestore(app)

  const months = process.argv.slice(2).length
    ? process.argv.slice(2)
    : monthKeyRange(prevMonthKey(), 3)

  /* Criteria — hydrate stored docs with in-code meta (higherIsWorse, etc.). */
  const critSnap = await getDocs(collection(db, COLLECTIONS.CRITERIA))
  const criteria = critSnap.empty
    ? CRITERIA.map((c) => ({ key: c.key, code: c.code, name: c.name, rank: c.defaultRank, higherIsWorse: c.higherIsWorse }))
    : critSnap.docs
        .map((d) => {
          const stored = { id: d.id, ...d.data() }
          const meta = CRITERIA.find((c) => c.key === stored.key)
          return { ...meta, ...stored }
        })
        .sort((a, b) => a.rank - b.rank)

  /* Areas. */
  const areaSnap = await getDocs(collection(db, COLLECTIONS.AREAS))
  const areas = areaSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  console.log(`→ Kriteria: ${criteria.length} · Area: ${areas.length}`)
  console.log(`→ Menjalankan AHP untuk: ${months.map(formatMonthKey).join(', ')}\n`)

  let ok = 0
  for (const month of months) {
    const dataSnap = await getDocs(
      query(collection(db, COLLECTIONS.DATA), where('month', '==', month)),
    )
    const data = dataSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const filled = new Set(data.map((d) => d.area_id))
    const missing = areas.filter((a) => !filled.has(a.id))
    if (areas.length === 0 || missing.length > 0) {
      console.log(`  ⚠ [SKIP] ${month}: data belum lengkap (${areas.length - missing.length}/${areas.length} area terisi).`)
      continue
    }

    const dataByArea = {}
    for (const row of data) dataByArea[row.area_id] = row
    const result = runAHP({ criteria, areas, dataByArea })

    const payload = {
      month,
      ahp_id: ahpIdOf(month),
      criteria: result.criteria,
      criteria_matrix: serializeMatrix(result.criteriaMatrix), // Firestore-safe
      criteria_weights: result.criteriaWeights,
      consistency: result.consistency,
      ranking: result.ranking,
      created_by: 'Seed Script',
      created_at: serverTimestamp(),
    }

    // Overwrite cleanly: drop any half-written doc, then write fresh.
    await deleteDoc(doc(db, COLLECTIONS.AHP_RESULTS, month)).catch(() => {})
    await setDoc(doc(db, COLLECTIONS.AHP_RESULTS, month), payload)
    ok++

    const cr = result.consistency.cr
    console.log(`  ✓ [OK] ${month} (${ahpIdOf(month)}) — setDoc berhasil. CR=${cr.toFixed(4)} ${result.consistency.isConsistent ? '(konsisten)' : '(PERLU TINJAU)'}`)
    result.ranking.forEach((r) => {
      console.log(`        #${r.rank} ${String(r.area_name).padEnd(14)} skor=${r.score.toFixed(4)}`)
    })
    console.log('')
  }

  console.log(`✓ Selesai. AHP berhasil disimpan untuk ${ok}/${months.length} bulan.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('\n✗ Run AHP gagal:', err.message)
  process.exit(1)
})
