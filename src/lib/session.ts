/**
 * HMAC-signed session cookie helpers — Edge-compatible (crypto.subtle only).
 * Cookie format: `uid:expiresAt:signature`
 * where signature = HMAC-SHA256(uid:expiresAt, SESSION_SECRET) as hex
 */

const COOKIE_NAME = "bb_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set");
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes.buffer;
}

export async function createSessionCookie(uid: string): Promise<string> {
  const key = await getKey();
  const expiresAt = (Date.now() + SESSION_TTL_MS).toString();
  const payload = `${uid}:${expiresAt}`;
  const sig = bufToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return `${payload}:${sig}`;
}

export async function verifySessionCookie(value: string): Promise<string | null> {
  try {
    const parts = value.split(":");
    if (parts.length !== 3) return null;
    const [uid, expiresAt, sig] = parts;
    if (Date.now() > parseInt(expiresAt, 10)) return null;
    const key = await getKey();
    const payload = `${uid}:${expiresAt}`;
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBuf(sig),
      new TextEncoder().encode(payload),
    );
    return valid ? uid : null;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
