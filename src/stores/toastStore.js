import { create } from 'zustand'

/** Lightweight transient toast notifications (success / error / info). */
let seq = 0

const useToastStore = create((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3800)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Imperative helpers usable outside React components. */
export const toast = {
  success: (msg) => useToastStore.getState().push('success', msg),
  error: (msg) => useToastStore.getState().push('error', msg),
  info: (msg) => useToastStore.getState().push('info', msg),
}

export default useToastStore
