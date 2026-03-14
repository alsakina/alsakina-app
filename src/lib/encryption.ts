// lib/encryption.ts
// ─────────────────────────────────────────────────
// Client-side AES-256 encryption for journal entries.
//
// Uses expo-crypto for secure random key generation
// and crypto-js for AES encryption/decryption.
//
// Install:
//   npx expo install expo-secure-store expo-crypto crypto-js
//   npm install --save-dev @types/crypto-js
// ─────────────────────────────────────────────────

import * as SecureStore from "expo-secure-store";
import * as ExpoCrypto from "expo-crypto";
import CryptoJS from "crypto-js";

const KEY_STORAGE_ID = "al_sakina_journal_key";

/* ── Key management ────────────────────────────── */

async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_STORAGE_ID);

  if (!key) {
    // Use expo-crypto for secure random bytes (works in React Native)
    const randomBytes = await ExpoCrypto.getRandomBytesAsync(32);
    key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await SecureStore.setItemAsync(KEY_STORAGE_ID, key);
  }

  return key;
}

/* ── Encrypt / Decrypt ─────────────────────────── */

export async function encrypt(
  plaintext: string | null | undefined
): Promise<string | null> {
  if (!plaintext) return null;

  const key = await getOrCreateKey();
  const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
  return encrypted;
}

export async function decrypt(
  ciphertext: string | null | undefined
): Promise<string | null> {
  if (!ciphertext) return null;

  try {
    const key = await getOrCreateKey();
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // If decryption produced empty string, likely unencrypted plaintext
    if (!decrypted) return ciphertext;

    return decrypted;
  } catch {
    // Decryption failed — probably unencrypted legacy data
    return ciphertext;
  }
}

export async function encryptJournalEntry(entry: {
  title?: string | null;
  body: string;
}): Promise<{ title: string | null; body: string }> {
  const [encTitle, encBody] = await Promise.all([
    encrypt(entry.title),
    encrypt(entry.body),
  ]);

  return {
    title: encTitle,
    body: encBody!,
  };
}

export async function decryptJournalEntry<
  T extends { title?: string | null; body: string }
>(entry: T): Promise<T> {
  const [decTitle, decBody] = await Promise.all([
    decrypt(entry.title),
    decrypt(entry.body),
  ]);

  return {
    ...entry,
    title: decTitle,
    body: decBody!,
  };
}

export async function exportKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_STORAGE_ID);
}

export async function importKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_STORAGE_ID, key);
}