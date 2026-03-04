/**
 * AES-256-GCM encryption for stored API keys.
 * Requires env var: API_KEY_ENCRYPTION_SECRET (32-byte hex string, i.e. 64 hex chars).
 *
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const ALG = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not set');
  }
  const key = Buffer.from(secret, 'hex');
  if (key.length !== 32) {
    throw new Error('API_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)');
  }
  return key;
}

/**
 * Encrypts plaintext and returns a base64 string: iv + ciphertext + tag
 */
export function encryptApiKey(plaintext: string): string {
  const { createCipheriv, randomBytes } = require('crypto') as typeof import('crypto');
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALG, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString('base64');
}

/**
 * Decrypts a base64 string produced by encryptApiKey.
 * Returns null if decryption fails (wrong key, tampered data, or plaintext stored directly).
 */
export function decryptApiKey(encoded: string): string | null {
  try {
    const { createDecipheriv } = require('crypto') as typeof import('crypto');
    const key = getKey();
    const buf = Buffer.from(encoded, 'base64');
    if (buf.length < IV_BYTES + TAG_BYTES + 1) return null;
    const iv = buf.subarray(0, IV_BYTES);
    const tag = buf.subarray(buf.length - TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
  } catch {
    return null;
  }
}
