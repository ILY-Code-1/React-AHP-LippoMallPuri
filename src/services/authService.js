import { verifyPassword } from '../lib/crypto'
import { getUserByEmail, getUserById, setUserPassword } from './userService'

/** Strip the password hash before a user object enters app state. */
const sanitize = (user) => {
  if (!user) return null
  const { password, ...safe } = user // eslint-disable-line no-unused-vars
  return safe
}

/**
 * Authenticate against `users_enerlyze`.
 * @returns the user (without password) on success.
 * @throws  on unknown email or wrong password.
 */
export const login = async ({ email, password }) => {
  const user = await getUserByEmail(email.trim())
  if (!user) throw new Error('Email atau password salah.')
  if (!verifyPassword(password, user.password)) {
    throw new Error('Email atau password salah.')
  }
  return sanitize(user)
}

/**
 * Change the current user's own password (requires the current password).
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await getUserById(userId)
  if (!user) throw new Error('User tidak ditemukan.')
  if (!verifyPassword(currentPassword, user.password)) {
    throw new Error('Password saat ini salah.')
  }
  await setUserPassword(userId, newPassword)
}
