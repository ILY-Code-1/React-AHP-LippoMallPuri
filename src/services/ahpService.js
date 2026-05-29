import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../constants/collections'
import { runAHP, serializeMatrix } from '../lib/ahp'
import { getCriteria } from './criteriaService'
import { getAreas } from './areaService'
import { getDataByMonth } from './dataService'

const col = collection(db, COLLECTIONS.AHP_RESULTS)

/** Human-readable AHP id, e.g. month "2026-04" → "AHP-2026-04". */
export const ahpIdOf = (month) => `AHP-${month}`

/** The stored AHP result for a month, or null if it has not been run. */
export const getAhpResult = async (month) => {
  const snap = await getDoc(doc(db, COLLECTIONS.AHP_RESULTS, month))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** All AHP results (for the dashboard chart). */
export const getAllAhpResults = async () => {
  const snap = await getDocs(col)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Check how complete a month is: which registered areas still miss input.
 * @returns { areas, data, missing: Area[], complete: boolean }
 */
export const getMonthCompleteness = async (month) => {
  const [areas, data] = await Promise.all([getAreas(), getDataByMonth(month)])
  const filledAreaIds = new Set(data.map((d) => d.area_id))
  const missing = areas.filter((a) => !filledAreaIds.has(a.id))
  return { areas, data, missing, complete: areas.length > 0 && missing.length === 0 }
}

/**
 * Run AHP for `month` and persist the result (doc id = month).
 * Re-running simply overwrites the previous result.
 */
export const runAndSaveAHP = async (month, createdBy) => {
  const { areas, data, complete } = await getMonthCompleteness(month)
  if (!complete) {
    throw new Error('Data belum lengkap di semua area untuk bulan ini.')
  }

  const criteria = await getCriteria()
  const dataByArea = {}
  for (const row of data) dataByArea[row.area_id] = row

  const result = runAHP({ criteria, areas, dataByArea })

  const payload = {
    month,
    ahp_id: ahpIdOf(month),
    criteria: result.criteria,
    criteria_matrix: serializeMatrix(result.criteriaMatrix),
    criteria_weights: result.criteriaWeights,
    consistency: result.consistency,
    ranking: result.ranking,
    created_by: createdBy?.name || createdBy?.email || 'Admin',
    created_at: serverTimestamp(),
  }
  await setDoc(doc(db, COLLECTIONS.AHP_RESULTS, month), payload)
  return payload
}

/** Delete only the AHP result for a month — input data is left untouched. */
export const deleteAhpResult = async (month) => {
  await deleteDoc(doc(db, COLLECTIONS.AHP_RESULTS, month))
}
