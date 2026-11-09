/**
 * Secure local encryption for user API keys using Web Crypto API (AES-GCM 256-bit).
 * Keys are derived using PBKDF2 with salt.
 */

const SALT = new Uint8Array([23, 89, 12, 199, 44, 201, 78, 123, 90, 11, 230, 45, 67, 89, 12, 34]);
const FIXED_APP_SECRET = "AuraChat-Local-Vault-v1-SaltKey";

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API is not available');
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const subtle = getCrypto().subtle;
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptApiKey(apiKey: string, userPassphrase?: string): Promise<string> {
  if (!apiKey) return '';
  const cryptoObj = getCrypto();
  const secret = userPassphrase ? `${FIXED_APP_SECRET}:${userPassphrase}` : FIXED_APP_SECRET;
  const key = await deriveKey(secret);

  const iv = new Uint8Array(12);
  cryptoObj.getRandomValues(iv);

  const encodedData = new TextEncoder().encode(apiKey);
  const encrypted = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return bytesToBase64(combined);
}

export async function decryptApiKey(encryptedBase64: string, userPassphrase?: string): Promise<string> {
  if (!encryptedBase64) return '';
  try {
    const cryptoObj = getCrypto();
    const secret = userPassphrase ? `${FIXED_APP_SECRET}:${userPassphrase}` : FIXED_APP_SECRET;
    const key = await deriveKey(secret);

    const combined = base64ToBytes(encryptedBase64);

    if (combined.length < 13) return '';
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Failed to decrypt API key:', err);
    return '';
  }
}
