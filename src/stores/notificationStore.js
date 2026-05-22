import { create } from 'zustand'

/**
 * Lightweight refresh signal for the notification bell.
 *
 * `generateNotifications()` runs asynchronously at login while the bell is
 * already mounted. Calling `triggerRefresh()` once generation finishes bumps
 * `refreshKey`, which the bell watches to re-fetch — so notifications appear
 * right after login without needing a page reload.
 */
const useNotificationStore = create((set) => ({
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}))

export default useNotificationStore
