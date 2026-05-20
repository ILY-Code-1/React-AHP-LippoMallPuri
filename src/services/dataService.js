import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../constants/collections'

const col = collection(db, COLLECTIONS.DATA)

const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

/** All monthly energy records (used by the dashboard / admin overview). */
export const getAllData = async () => mapDocs(await getDocs(col))

/** Records for a single month key (`YYYY-MM`). */
export const getDataByMonth = async (month) =>
  mapDocs(await getDocs(query(col, where('month', '==', month))))

/** Records for a set of month keys (max 30 — Firestore `in` limit). */
export const getDataByMonths = async (monthKeys) => {
  if (!monthKeys?.length) return []
  return mapDocs(await getDocs(query(col, where('month', 'in', monthKeys))))
}

/** All records belonging to one area. */
export const getDataByArea = async (areaId) =>
  mapDocs(await getDocs(query(col, where('area_id', '==', areaId))))

/** Records for several areas at once (max 30 area ids). */
export const getDataByAreas = async (areaIds) => {
  if (!areaIds?.length) return []
  return mapDocs(await getDocs(query(col, where('area_id', 'in', areaIds))))
}

export const createData = async (payload) => {
  // Guard: one record per (area, month).
  const dup = await getDocs(
    query(col, where('area_id', '==', payload.area_id), where('month', '==', payload.month)),
  )
  if (!dup.empty) {
    throw new Error('Data untuk area & bulan ini sudah ada. Silakan edit data yang ada.')
  }
  const ref = await addDoc(col, {
    area_id: payload.area_id,
    month: payload.month,
    energy: Number(payload.energy) || 0,
    energy_area_m2: Number(payload.energy_area_m2) || 0,
    cost: Number(payload.cost) || 0,
    duration: Number(payload.duration) || 0,
    maintenance: Number(payload.maintenance) || 0,
    created_by: payload.created_by || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  return ref.id
}

export const updateData = async (id, payload) => {
  await updateDoc(doc(db, COLLECTIONS.DATA, id), {
    area_id: payload.area_id,
    month: payload.month,
    energy: Number(payload.energy) || 0,
    energy_area_m2: Number(payload.energy_area_m2) || 0,
    cost: Number(payload.cost) || 0,
    duration: Number(payload.duration) || 0,
    maintenance: Number(payload.maintenance) || 0,
    updated_at: serverTimestamp(),
  })
}

export const deleteData = async (id) => {
  await deleteDoc(doc(db, COLLECTIONS.DATA, id))
}
