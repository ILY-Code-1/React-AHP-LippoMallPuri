import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../constants/collections'
import { hashPassword, DEFAULT_PASSWORD } from '../lib/crypto'

const col = collection(db, COLLECTIONS.USERS)

/** All users, newest first. Passwords are never stripped here — callers ignore them. */
export const getUsers = async () => {
  const snap = await getDocs(col)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export const getUserById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Find a user by login identifier (email). */
export const getUserByEmail = async (email) => {
  const q = query(col, where('email', '==', email))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export const createUser = async ({ name, email, password, role }) => {
  const existing = await getUserByEmail(email)
  if (existing) throw new Error('Email sudah terdaftar.')
  const ref = await addDoc(col, {
    name,
    email,
    password: hashPassword(password),
    role,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  return ref.id
}

/** Update profile fields. If `password` is provided it is re-hashed. */
export const updateUser = async (id, { name, email, role, password }) => {
  const payload = { name, email, role, updated_at: serverTimestamp() }
  if (password) payload.password = hashPassword(password)
  await updateDoc(doc(db, COLLECTIONS.USERS, id), payload)
}

/** Reset a user's password to the project default (`Test1234@`). */
export const resetUserPassword = async (id) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, id), {
    password: hashPassword(DEFAULT_PASSWORD),
    updated_at: serverTimestamp(),
  })
  return DEFAULT_PASSWORD
}

/** Change own password (already-hashed value written by caller after verify). */
export const setUserPassword = async (id, newPlainPassword) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, id), {
    password: hashPassword(newPlainPassword),
    updated_at: serverTimestamp(),
  })
}

/**
 * Delete a user. Blocked when the user still owns areas in `areas_enerlyze`.
 */
export const deleteUser = async (id) => {
  const areaSnap = await getDocs(
    query(collection(db, COLLECTIONS.AREAS), where('user_id', '==', id)),
  )
  if (!areaSnap.empty) {
    throw new Error(
      `User masih ditugaskan pada ${areaSnap.size} area. Pindahkan atau hapus area tersebut terlebih dahulu.`,
    )
  }
  await deleteDoc(doc(db, COLLECTIONS.USERS, id))
}
