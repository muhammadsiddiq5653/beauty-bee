import { NextRequest } from "next/server";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function getBearerToken(req: NextRequest): string {
  const header = req.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new AuthError("Unauthorized", 401);
  return match[1];
}

export async function requireAdminToken(req: NextRequest): Promise<string> {
  const token = getBearerToken(req);
  const adminUid = process.env.ADMIN_UID;
  if (!adminUid) throw new AuthError("ADMIN_UID environment variable is not set", 500);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new AuthError("Firebase API key is not configured", 500);

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) throw new AuthError("Invalid admin session", 401);

  const data = await res.json() as { users?: Array<{ localId?: string }> };
  const uid = data.users?.[0]?.localId;
  if (!uid || uid !== adminUid) throw new AuthError("Forbidden", 403);

  return token;
}
