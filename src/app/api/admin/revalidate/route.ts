import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";

const PATHS = ["/", "/shop", "/product/[id]", "/bundle/[id]"];

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);

    revalidateTag("shop-data", { expire: 0 });
    for (const path of PATHS) {
      revalidatePath(path, "page");
    }

    return NextResponse.json({
      ok: true,
      revalidated: {
        tags: ["shop-data"],
        paths: PATHS,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Revalidation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
