import CryptoJS from 'crypto-js'

/**
 * Cryptography helpers for Enerlyze.
 *
 * Two distinct concerns live here:
 *  1. SECRET env encryption — obfuscates the Firebase config so it is not
 *     stored in plain view. The key below is intentionally hardcoded; this is
 *     obfuscation, not high-grade security (the prompt explicitly allows this).
 *  2. User password hashing — PBKDF2 with a random per-password salt, stored
 *     as `salt:hash`. Used to verify logins without keeping plaintext.
 */

// Hardcoded AES key for the SECRET env payload. Shared by the runtime app and
// the `npm run encrypt-env` CLI so both sides round-trip the same string.
export const SECRET_KEY = 'enerlyze-lippo-mall-puri-2026-ahp-secret-key'

/** Encrypt an arbitrary JS object into an AES string (for the SECRET env). */
export const encryptConfig = (configObject) => {
  const json = JSON.stringify(configObject)
  return CryptoJS.AES.encrypt(json, SECRET_KEY).toString()
}

/** Decrypt a SECRET env string back into the original config object. */
export const decryptConfig = (cipherText) => {
  if (!cipherText) throw new Error('SECRET env is empty.')
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY)
  const json = bytes.toString(CryptoJS.enc.Utf8)
  if (!json) throw new Error('SECRET env could not be decrypted (wrong key or corrupt value).')
  return JSON.parse(json)
}

/* ----------------------------- Password hashing ---------------------------- */

const PBKDF2_ITERATIONS = 5000
const KEY_SIZE = 256 / 32

/**
 * Hash a plaintext password. Returns `salt:derivedKey` (both hex).
 * A fresh random salt is generated every call.
 */
export const hashPassword = (plainPassword) => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8)
  const hash = CryptoJS.PBKDF2(plainPassword, salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  })
  return `${salt.toString()}:${hash.toString()}`
}

/** Verify a plaintext password against a stored `salt:hash` string. */
export const verifyPassword = (plainPassword, stored) => {
  if (!stored || !stored.includes(':')) return false
  const [saltHex, originalHash] = stored.split(':')
  const salt = CryptoJS.enc.Hex.parse(saltHex)
  const hash = CryptoJS.PBKDF2(plainPassword, salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  })
  return hash.toString() === originalHash
}

/** Default password applied when an admin resets a user's password. */
export const DEFAULT_PASSWORD = 'Test1234@'
