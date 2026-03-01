/**
 * src/lib/crypto/secrets.ts
 *
 * Criptografia AES-256-GCM para armazenamento seguro de credenciais de integrações.
 *
 * ENCRYPTION_KEY: variável de ambiente obrigatória.
 * Formato aceito: 32 bytes em base64 (44 chars) ou hex (64 chars).
 *
 * Para gerar em Node.js:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits — padrão GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "[secrets] ENCRYPTION_KEY não configurada. " +
        "Defina como 32 bytes em base64 (44 chars) ou hex (64 chars)."
    );
  }
  const buf =
    raw.length === 64
      ? Buffer.from(raw, "hex")
      : Buffer.from(raw, "base64");

  if (buf.length !== 32) {
    throw new Error(
      "[secrets] ENCRYPTION_KEY deve ter exatamente 32 bytes " +
        `(recebido: ${buf.length} bytes).`
    );
  }
  return buf;
}

/**
 * Criptografa um objeto JSON.
 * Retorna string no formato "iv:authTag:ciphertext" em base64.
 */
export function encryptJson(obj: unknown): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const plaintext = JSON.stringify(obj);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Descriptografa um payload criado por encryptJson.
 * Nunca loga o conteúdo descriptografado.
 */
export function decryptJson<T = unknown>(ciphertext: string): T {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("[secrets] Formato de payload inválido.");
  }
  const [ivB64, tagB64, dataB64] = parts as [string, string, string];
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
