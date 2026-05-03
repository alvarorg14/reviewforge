import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'

/** Fixed salt for key derivation (not secret; binds derivation to this app). */
const SCRYPT_SALT = Buffer.from('reviewforge.cursor_api_key.v1', 'utf8')

export function assertEncryptionKey(masterSecret: string): void {
  if (typeof masterSecret !== 'string' || masterSecret.length < 32) {
    throw new Error(
      'NUXT_ENCRYPTION_KEY must be set to a string of at least 32 characters',
    )
  }
}

function deriveAesKey(masterSecret: string): Buffer {
  assertEncryptionKey(masterSecret)
  return scryptSync(masterSecret, SCRYPT_SALT, 32)
}

/**
 * AES-256-GCM encrypt; returns base64(iv(12) || authTag(16) || ciphertext).
 */
export function encryptSecret(plaintext: string, masterSecret: string): string {
  const key = deriveAesKey(masterSecret)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  const combined = Buffer.concat([iv, authTag, ciphertext])
  return combined.toString('base64')
}

/**
 * Decrypt payload from {@link encryptSecret}. Throws if tampered or invalid.
 */
export function decryptSecret(encoded: string, masterSecret: string): string {
  const key = deriveAesKey(masterSecret)
  const buf = Buffer.from(encoded, 'base64')
  if (buf.length < 12 + 16 + 1) {
    throw new Error('Invalid encrypted payload')
  }
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}
