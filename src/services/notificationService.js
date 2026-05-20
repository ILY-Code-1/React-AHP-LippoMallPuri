import {
  collection, doc, getDocs, addDoc, deleteDoc, writeBatch,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS } from '../constants/collections'
import { prevMonthKey, monthKeyRange, formatMonthKey } from '../lib/format'
import { getAreasByUser, getAreas } from './areaService'
import { getDataByMonths } from './dataService'
import { getAllAhpResults } from './ahpService'

const col = collection(db, COLLECTIONS.NOTIFICATIONS)

/** Notifications for one user, newest first. */
export const getNotifications = async (userId) => {
  const snap = await getDocs(query(col, where('user_id', '==', userId)))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
}

export const deleteNotification = async (id) => {
  await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id))
}

/** Remove every notification of a user (called on logout & "mark all read"). */
export const clearNotifications = async (userId) => {
  const snap = await getDocs(query(col, where('user_id', '==', userId)))
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

/**
 * Generate fresh AHP-data notifications for a user at login.
 * Existing notifications are cleared first so logins never stack duplicates.
 * Only the most recent 3 months are tracked.
 */
export const generateNotifications = async (user) => {
  await clearNotifications(user.id)

  const months = monthKeyRange(prevMonthKey(), 3) // last 3 completed months
  const items = []

  if (user.role === 'staff') {
    const areas = await getAreasByUser(user.id)
    if (areas.length) {
      const data = await getDataByMonths(months)
      for (const month of months) {
        for (const area of areas) {
          const has = data.some((d) => d.area_id === area.id && d.month === month)
          if (!has) {
            items.push({
              user_id: user.id,
              type: 'missing-data',
              message: `Anda belum input data di area "${area.name}" untuk bulan ${formatMonthKey(month)}.`,
              link: '/dashboard/data',
            })
          }
        }
      }
    }
  } else if (user.role === 'admin') {
    const [areas, data, results] = await Promise.all([
      getAreas(),
      getDataByMonths(months),
      getAllAhpResults(),
    ])
    for (const month of months) {
      if (!areas.length) continue
      const filled = new Set(data.filter((d) => d.month === month).map((d) => d.area_id))
      const allFilled = areas.every((a) => filled.has(a.id))
      const hasResult = results.some((r) => r.month === month)
      if (allFilled && !hasResult) {
        items.push({
          user_id: user.id,
          type: 'ahp-pending',
          message: `Semua area sudah mengisi data — AHP belum dijalankan untuk bulan ${formatMonthKey(month)}.`,
          link: '/admin/data',
        })
      }
    }
  }

  for (const item of items) {
    await addDoc(col, { ...item, created_at: serverTimestamp() })
  }
  return items.length
}
