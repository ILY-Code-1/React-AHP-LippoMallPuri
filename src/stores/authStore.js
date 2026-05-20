import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

/**
 * Auth state with cookie-backed session persistence.
 *
 * - The user object is persisted to localStorage (zustand `persist`).
 * - A `enerlyze_session` cookie (7-day expiry) is the session source of truth.
 *   If the cookie is gone (expired / cleared) the rehydrated state is dropped,
 *   so a returning user with a valid cookie lands straight on the dashboard.
 */
const SESSION_COOKIE = 'enerlyze_session'
const COOKIE_DAYS = 7

export const hasSessionCookie = () => Boolean(Cookies.get(SESSION_COOKIE))

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) => {
        Cookies.set(SESSION_COOKIE, userData.id, {
          expires: COOKIE_DAYS,
          sameSite: 'strict',
        })
        set({ user: userData, isAuthenticated: true })
      },

      logout: () => {
        Cookies.remove(SESSION_COOKIE)
        set({ user: null, isAuthenticated: false })
      },

      /** Patch the in-memory user (e.g. after a profile edit). */
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
    }),
    {
      name: 'enerlyze-auth',
      onRehydrateStorage: () => (state) => {
        // Drop persisted auth if the session cookie is no longer present.
        if (state && state.isAuthenticated && !hasSessionCookie()) {
          state.user = null
          state.isAuthenticated = false
        }
      },
    },
  ),
)

export default useAuthStore
