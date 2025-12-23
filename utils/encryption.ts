/**
 * Encryption utilities for profile data
 * Uses Web Crypto API with AES-GCM
 */

/**
 * Derive encryption key from wallet address and optional password
 * @param walletAddress User's wallet address
 * @param password Optional password (if not provided, uses address)
 * @returns CryptoKey for encryption/decryption
 */
async function deriveKey(
  walletAddress: string,
  password?: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = password
    ? encoder.encode(`${walletAddress}:${password}`)
    : encoder.encode(walletAddress);

  const keyData = await crypto.subtle.digest("SHA-256", keyMaterial);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt profile data
 * @param data Profile data to encrypt
 * @param walletAddress User's wallet address
 * @param password Optional password for additional security
 * @returns Encrypted data as base64 string
 */
export async function encryptProfileData(
  data: string,
  walletAddress: string,
  password?: string
): Promise<string> {
  try {
    const key = await deriveKey(walletAddress, password);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Generate random IV (12 bytes for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      dataBytes
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error: any) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt profile data
 * @param encryptedData Encrypted data as base64 string
 * @param walletAddress User's wallet address
 * @param password Optional password (must match encryption password)
 * @returns Decrypted data as string
 */
export async function decryptProfileData(
  encryptedData: string,
  walletAddress: string,
  password?: string
): Promise<string> {
  try {
    const key = await deriveKey(walletAddress, password);

    // Decode from base64
    const combined = Uint8Array.from(
      atob(encryptedData),
      (c) => c.charCodeAt(0)
    );

    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}



