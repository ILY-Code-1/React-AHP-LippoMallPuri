import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../constants/collections'

const col = collection(db, COLLECTIONS.AREAS)

/** All areas, sorted by name. */
export const getAreas = async () => {
  const snap = await getDocs(col)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export const getAreaById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTIONS.AREAS, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Areas assigned to a particular user (staff). */
export const getAreasByUser = async (userId) => {
  const q = query(col, where('user_id', '==', userId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export const createArea = async ({ name, description, user_id }) => {
  const ref = await addDoc(col, {
    name,
    description: description || '',
    user_id,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  return ref.id
}

export const updateArea = async (id, { name, description, user_id }) => {
  await updateDoc(doc(db, COLLECTIONS.AREAS, id), {
    name,
    description: description || '',
    user_id,
    updated_at: serverTimestamp(),
  })
}

/**
 * Delete an area. Blocked when the area is still referenced by any record in
 * `data_enerlyze`.
 */
export const deleteArea = async (id) => {
  const dataSnap = await getDocs(
    query(collection(db, COLLECTIONS.DATA), where('area_id', '==', id)),
  )
  if (!dataSnap.empty) {
    throw new Error(
      `Area masih memiliki ${dataSnap.size} catatan data energi. Hapus data tersebut terlebih dahulu.`,
    )
  }
  await deleteDoc(doc(db, COLLECTIONS.AREAS, id))
}
