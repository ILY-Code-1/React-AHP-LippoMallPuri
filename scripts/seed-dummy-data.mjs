/**
 * Dummy data seeder — populates `data_enerlyze` with realistic, trend-shaped
 * input for the last 3 completed months across every registered area.
 *
 *   npm run seed:dummy
 *
 * Behaviour:
 *   1. Ensures a staff user exists (creates staff@enerlyze.com / Staff1234@ if none).
 *   2. If `areas_enerlyze` has < 6 areas, creates the 6 standard Lippo Mall Puri
 *      floors (idempotent by name), assigned to the staff user.
 *   3. Generates deterministic, trend-shaped monthly energy data for ALL areas
 *      and upserts it (overwrite on re-run → idempotent).
 *
 * It does NOT run AHP and does NOT touch `ahp_results_enerlyze`.
 *
 * Document schema written to `data_enerlyze` mirrors src/services/dataService.js:
 *   { area_id, month, energy, energy_area_m2, cost, duration, maintenance,
 *     created_by, created_at, updated_at }
 *
 * Firebase config is read from the SECRET line in `.env` (same as seed.mjs).
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, doc, setDoc, addDoc, getDocs,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { decryptConfig, hashPassword } from '../src/lib/crypto.js'
import { COLLECTIONS } from '../src/constants/collections.js'
import { prevMonthKey, monthKeyRange, formatMonthKey } from '../src/lib/format.js'

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

/* ── Standard Lippo Mall Puri areas (created only if < 6 exist) ──────────── */
const AREA_DEFS = [
  { code: 'BS', name: 'Basement', description: 'Parkir, Ventilasi, Genset' },
  { code: 'LG', name: 'Lower Ground', description: 'Supermarket, Retail Kasual' },
  { code: 'GF', name: 'Ground Floor', description: 'Lobby, Anchor Tenant, Fashion Premium' },
  { code: 'UG', name: 'Upper Ground', description: 'Retail Fashion, Mezzanine' },
  { code: '1F', name: 'Lantai 1', description: 'Retail Fashion, F&B' },
  { code: '2F', name: 'Lantai 2', description: 'Hiburan, Bioskop, Arcade' },
]

/* ── Per-area generation profiles ───────────────────────────────────────── */
/* trend: how kWh moves across the 3 months (oldest → newest).
 * maint:  explicit maintenance frequency per month [oldest, mid, newest].
 * kwh / cost ranges act as safety clamps so values stay realistic.        */
const PROFILES = {
  BS: { trend: 'stable',    baseKwh: 85000,  area: 15000, hours: 720, maint: [4, 4, 3], kwh: [75000, 95000],   cost: [110e6, 140e6] },
  LG: { trend: 'worsening', baseKwh: 125000, area: 8500,  hours: 375, maint: [4, 3, 2], kwh: [120000, 160000], cost: [180e6, 240e6] },
  GF: { trend: 'improving', baseKwh: 122000, area: 7000,  hours: 345, maint: [3, 4, 5], kwh: [95000, 125000],  cost: [140e6, 185e6] },
  UG: { trend: 'improving', baseKwh: 108000, area: 6500,  hours: 345, maint: [2, 3, 4], kwh: [85000, 110000],  cost: [125e6, 165e6] },
  '1F': { trend: 'stable',  baseKwh: 115000, area: 7500,  hours: 345, maint: [3, 2, 3], kwh: [100000, 135000], cost: [150e6, 200e6] },
  '2F': { trend: 'worsening', baseKwh: 135000, area: 9000, hours: 378, maint: [3, 2, 1], kwh: [130000, 175000], cost: [195e6, 260e6] },
}
const NAME_TO_CODE = Object.fromEntries(AREA_DEFS.map((a) => [a.name, a.code]))
const PROFILE_CODES = Object.keys(PROFILES)

const RATE = { improving: -0.06, worsening: 0.07, stable: 0 }
const SEASONAL = [1.0, 1.04, 1.0] // oldest normal, mid +4% (libur/musim hujan), newest back to normal

/* Deterministic pseudo-random in [-1, 1] seeded by a string → stable re-runs. */
const seededUnit = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000 * 2 - 1
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const roundTo = (v, step) => Math.round(v / step) * step

/* Build one month's record values for an area given its profile + month index. */
const buildValues = (code, areaName, month, m) => {
  const p = PROFILES[code]
  const trendFactor = Math.pow(1 + RATE[p.trend], m)
  const kwhJitter = 1 + seededUnit(`${areaName}|${month}|kwh`) * 0.02
  let energy = p.baseKwh * trendFactor * SEASONAL[m] * kwhJitter
  energy = clamp(roundTo(energy, 100), p.kwh[0], p.kwh[1])

  const costJitter = 1 + seededUnit(`${areaName}|${month}|cost`) * 0.08
  let cost = energy * 1500 * costJitter
  cost = clamp(roundTo(cost, 1000), p.cost[0], p.cost[1])

  const duration = code === 'BS'
    ? 720
    : clamp(Math.round(p.hours + seededUnit(`${areaName}|${month}|dur`) * 12), 300, 400)

  return {
    energy,
    energy_area_m2: p.area,
    cost,
    duration,
    maintenance: p.maint[m],
  }
}

const main = async () => {
  const config = decryptConfig(readSecret())
  const app = initializeApp(config)
  const db = getFirestore(app)

  const usersCol = collection(db, COLLECTIONS.USERS)
  const areasCol = collection(db, COLLECTIONS.AREAS)
  const dataCol = collection(db, COLLECTIONS.DATA)

  /* 1. Ensure a staff user exists ---------------------------------------- */
  console.log('→ Memeriksa user staff...')
  let staffSnap = await getDocs(query(usersCol, where('role', '==', 'staff')))
  let staffId
  if (staffSnap.empty) {
    const ref = await addDoc(usersCol, {
      name: 'Staff Enerlyze',
      email: 'staff@enerlyze.com',
      password: hashPassword('Staff1234@'),
      role: 'staff',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    staffId = ref.id
    console.log('  ✓ Staff dibuat — staff@enerlyze.com / Staff1234@')
  } else {
    staffId = staffSnap.docs[0].id
    console.log(`  • Memakai staff yang ada: ${staffSnap.docs[0].data().email}`)
  }

  /* 2. Ensure areas (create the 6 standard floors if < 6 exist) ---------- */
  const loadAreas = async () => {
    const snap = await getDocs(areasCol)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  let areas = await loadAreas()
  console.log(`→ Area terdaftar saat ini: ${areas.length}`)
  if (areas.length < 6) {
    console.log('  Kurang dari 6 area — membuat area standar Lippo Mall Puri...')
    for (const def of AREA_DEFS) {
      if (areas.some((a) => a.name === def.name)) {
        console.log(`  • [SKIP] Area "${def.name}" sudah ada.`)
        continue
      }
      await addDoc(areasCol, {
        name: def.name,
        description: def.description,
        user_id: staffId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      console.log(`  ✓ [INSERT] Area "${def.name}" — ${def.description}`)
    }
    areas = await loadAreas()
  }
  areas.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  /* 3. Generate + upsert 3 months of data for every area ----------------- */
  const months = monthKeyRange(prevMonthKey(), 3) // [oldest, mid, newest]
  console.log(`\n→ Periode yang diisi: ${months.map(formatMonthKey).join(', ')}`)
  console.log(`→ Menulis data untuk ${areas.length} area × ${months.length} bulan = ${areas.length * months.length} dokumen\n`)

  const summary = []
  let inserted = 0
  let updated = 0

  for (let ai = 0; ai < areas.length; ai++) {
    const area = areas[ai]
    // Match profile by: (a) area name that is literally the code ("BS", "GF"...),
    // (b) full standard name ("Basement"...), else (c) round-robin fallback.
    const code = PROFILES[area.name]
      ? area.name
      : (NAME_TO_CODE[area.name] || PROFILE_CODES[ai % PROFILE_CODES.length])
    for (let m = 0; m < months.length; m++) {
      const month = months[m]
      const vals = buildValues(code, area.name, month, m)

      const dup = await getDocs(
        query(dataCol, where('area_id', '==', area.id), where('month', '==', month)),
      )
      const payload = {
        area_id: area.id,
        month,
        energy: vals.energy,
        energy_area_m2: vals.energy_area_m2,
        cost: vals.cost,
        duration: vals.duration,
        maintenance: vals.maintenance,
        created_by: area.user_id || staffId,
        updated_at: serverTimestamp(),
      }

      let action
      if (!dup.empty) {
        await setDoc(dup.docs[0].ref, payload, { merge: true })
        action = 'UPDATE'
        updated++
      } else {
        await addDoc(dataCol, { ...payload, created_at: serverTimestamp() })
        action = 'INSERT'
        inserted++
      }

      console.log(
        `  [${action}] ${area.name.padEnd(14)} ${month}: ` +
        `kWh=${vals.energy.toLocaleString('id-ID')}, ` +
        `m²=${vals.energy_area_m2.toLocaleString('id-ID')}, ` +
        `Rp=${vals.cost.toLocaleString('id-ID')}, ` +
        `Jam=${vals.duration}, Maint=${vals.maintenance}x`,
      )

      summary.push({ area: area.name, code, month, ...vals })
    }
  }

  /* 4. Markdown summary table -------------------------------------------- */
  console.log('\n──────────────── RINGKASAN (Markdown) ────────────────\n')
  console.log('| Area | Profil | Bulan | kWh | Luas (m²) | Biaya (Rp) | Jam | Maint |')
  console.log('|------|--------|-------|-----|-----------|------------|-----|-------|')
  for (const r of summary) {
    console.log(
      `| ${r.area} | ${r.code} | ${r.month} | ${r.energy.toLocaleString('id-ID')} | ` +
      `${r.energy_area_m2.toLocaleString('id-ID')} | ${r.cost.toLocaleString('id-ID')} | ` +
      `${r.duration} | ${r.maintenance}x |`,
    )
  }

  console.log(
    `\n✓ Selesai. Area dipakai: ${areas.length} · Dokumen INSERT: ${inserted} · UPDATE: ${updated}`,
  )
  console.log('  AHP TIDAK dijalankan & ahp_results_enerlyze dibiarkan kosong (sesuai permintaan).')
  process.exit(0)
}

main().catch((err) => {
  console.error('\n✗ Seed dummy gagal:', err.message)
  process.exit(1)
})
