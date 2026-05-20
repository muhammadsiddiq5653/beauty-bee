import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function cleanFolder(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "beauty-bee";
  const folder = raw.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\/{2,}/g, "/").slice(0, 80);
  return folder.startsWith("beauty-bee") ? folder : "beauty-bee";
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = cleanFolder(formData.get("folder"));

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    const isVideo = file.type.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

    const upload = new FormData();
    upload.append("file", file);
    upload.append("api_key", apiKey);
    upload.append("timestamp", timestamp);
    upload.append("folder", folder);
    upload.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: upload,
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message ?? "Upload failed" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.secure_url, type: resourceType });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
