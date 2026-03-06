/**
 * lib/encryption.ts
 *
 * AES-256-GCM encryption helpers for Polymarket dashboard.
 *
 * MUST stay byte-for-byte compatible with the bot's EncryptionService:
 *   - Algorithm : AES-256-GCM
 *   - IV        : 12 random bytes (96-bit, recommended for GCM)
 *   - Auth tag  : 16 bytes (GCM default)
 *   - Wire format (all hex, colon-delimited): iv:tag:encrypted
 *   - Key source: ENCRYPTION_SECRET env var — exactly 32 UTF-8 bytes
 *
 * The bot's decrypt() will accept anything produced by encrypt() here, and
 * vice-versa, because the format, algorithm, and key derivation are identical.
 */

import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Key resolution
// ---------------------------------------------------------------------------

/**
 * Returns the 32-byte key buffer derived from ENCRYPTION_SECRET.
 * Throws at call-time (not at import-time) so Next.js build steps that never
 * call encrypt/decrypt don't fail due to a missing env var.
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET is not set in environment variables.");
  }
  const key = Buffer.from(secret, "utf-8");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_SECRET must be exactly 32 UTF-8 bytes for AES-256-GCM ` +
        `(got ${key.length} byte${key.length === 1 ? "" : "s"}).`
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypts a plaintext string with AES-256-GCM.
 *
 * @param text  The plaintext to encrypt (e.g. a private key or API secret).
 * @returns     A colon-delimited hex string: `iv:tag:encrypted`
 *
 * @example
 *   const cipher = encrypt("my-secret-api-key");
 *   // "a1b2c3...:d4e5f6...:7890ab..."
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV — GCM best practice
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf-8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag(); // 16-byte authentication tag

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypts a ciphertext string produced by `encrypt()` (or the bot's
 * EncryptionService.encrypt()).
 *
 * @param ciphertext  Colon-delimited hex string: `iv:tag:encrypted`
 * @returns           The original plaintext string.
 * @throws            If the format is invalid or the auth tag doesn't match
 *                    (indicates tampered or corrupted data).
 *
 * @example
 *   const plain = decrypt("a1b2c3...:d4e5f6...:7890ab...");
 *   // "my-secret-api-key"
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid ciphertext format — expected "iv:tag:encrypted" ` +
        `but got ${parts.length} segment${parts.length === 1 ? "" : "s"}.`
    );
  }

  const [ivHex, tagHex, encHex] = parts;
  const key = getKey();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf-8");
}

// ---------------------------------------------------------------------------
// Convenience: encrypt a whole credentials object at once
// ---------------------------------------------------------------------------

export type RawClientCredentials = {
  private_key: string;
  poly_api_key: string;
  poly_secret: string;
  poly_passphrase: string;
};

export type EncryptedClientCredentials = RawClientCredentials; // same shape, encrypted values

/**
 * Encrypts all four sensitive credential fields in one call.
 * Non-credential fields (funder_address, trade_amount_usd, etc.) pass through
 * untouched via the spread so the caller doesn't need to reassemble the object.
 */
export function encryptCredentials(
  raw: RawClientCredentials
): EncryptedClientCredentials {
  return {
    private_key: encrypt(raw.private_key),
    poly_api_key: encrypt(raw.poly_api_key),
    poly_secret: encrypt(raw.poly_secret),
    poly_passphrase: encrypt(raw.poly_passphrase),
  };
}