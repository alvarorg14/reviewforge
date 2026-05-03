import { describe, expect, it } from 'vitest'
import {
  decryptSecret,
  encryptSecret,
} from '../server/services/crypto/secretBox'

const MASTER = 'x'.repeat(32)

describe('secretBox', () => {
  it('roundtrips plaintext', () => {
    const plain = 'crsr_test_key_value_for_encryption_roundtrip'
    const enc = encryptSecret(plain, MASTER)
    expect(enc).not.toContain(plain)
    expect(decryptSecret(enc, MASTER)).toBe(plain)
  })

  it('throws when ciphertext is tampered', () => {
    const enc = encryptSecret('secret-api-key-1234567890', MASTER)
    const buf = Buffer.from(enc, 'base64')
    buf[buf.length - 1] ^= 0xff
    const tampered = buf.toString('base64')
    expect(() => decryptSecret(tampered, MASTER)).toThrow()
  })
})
