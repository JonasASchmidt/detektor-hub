import { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

export interface MobileSession {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

/**
 * Extracts and validates the session from a mobile API request.
 *
 * Reads the `Authorization: Bearer <token>` header and decodes the JWT
 * using NEXTAUTH_SECRET. Returns null if the token is missing or invalid.
 *
 * Usage in mobile API routes:
 *   const session = await getMobileSession(req);
 *   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function getMobileSession(
  req: NextRequest
): Promise<MobileSession | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!decoded?.id) return null;
    return {
      id: decoded.id as string,
      name: (decoded.name as string) ?? null,
      email: (decoded.email as string) ?? null,
      role: (decoded.role as string) ?? "USER",
    };
  } catch {
    return null;
  }
}
