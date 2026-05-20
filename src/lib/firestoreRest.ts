const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!PROJECT_ID) {
  console.warn("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured.");
}

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null };

type FsFields = Record<string, FsValue>;

function fsToPlain(fields: FsFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if ("stringValue" in value) out[key] = value.stringValue;
    else if ("integerValue" in value) out[key] = Number(value.integerValue);
    else if ("doubleValue" in value) out[key] = value.doubleValue;
    else if ("booleanValue" in value) out[key] = value.booleanValue;
    else out[key] = null;
  }
  return out;
}

function toFsFields(data: Record<string, unknown>): FsFields {
  const fields: FsFields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") fields[key] = { stringValue: value };
    else if (typeof value === "number" && Number.isInteger(value)) fields[key] = { integerValue: String(value) };
    else if (typeof value === "number" && Number.isFinite(value)) fields[key] = { doubleValue: value };
    else if (typeof value === "boolean") fields[key] = { booleanValue: value };
    else fields[key] = { nullValue: null };
  }
  return fields;
}

export async function fsGet(collection: string, id: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${FS_BASE}/${collection}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Firestore GET failed: ${res.status}`);
  }
  const doc = await res.json();
  return { id, ...fsToPlain(doc.fields ?? {}) };
}

export async function fsPatch(
  collection: string,
  id: string,
  data: Record<string, unknown>,
  token: string
): Promise<void> {
  const fields = toFsFields(data);
  const mask = Object.keys(fields).map(field => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&");
  const res = await fetch(`${FS_BASE}/${collection}/${encodeURIComponent(id)}?${mask}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Firestore PATCH failed: ${res.status}`);
  }
}

