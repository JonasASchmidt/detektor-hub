import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

/**
 * POST /api/mobile/login
 *
 * Authenticates a user with email + password and returns a signed JWT.
 * The token is encoded with NEXTAUTH_SECRET so it is compatible with
 * next-auth/jwt's getToken() — mobile API routes can validate it via
 * the Authorization: Bearer <token> header.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort werden benötigt." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    // Return same error for both "not found" and "wrong password" to avoid
    // leaking which emails exist in the system.
    return NextResponse.json(
      { error: "Ungültige Anmeldedaten." },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Ungültige Anmeldedaten." },
      { status: 401 }
    );
  }

  // Encode a JWT with the same shape as NextAuth's session JWT so that
  // getToken() in mobile API routes can decode it transparently.
  const token = await encode({
    token: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      // No expiry set here — mobile tokens are long-lived; add exp if needed.
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
