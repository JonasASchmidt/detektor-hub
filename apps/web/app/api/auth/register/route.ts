import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password1, password2 } = await req.json();

    if (!name || !email || !password1 || !password2) {
      return NextResponse.json(
        { error: "Bitte fülle alle Felder aus." },
        { status: 400 }
      );
    }

    // Input length limits to prevent abuse
    if (name.length > 100 || email.length > 254 || password1.length > 128) {
      return NextResponse.json(
        { error: "Eingabe zu lang." },
        { status: 400 }
      );
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    if (password1 !== password2) {
      return NextResponse.json(
        { error: "Die Passwörter stimmen nicht überein." },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Diese Email-Adresse ist bereits registriert." },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password1, 10);

    // Create user in the database
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "USER" },
    });

    // Strip password hash from response
    const { password: _, ...safeUser } = user;
    return NextResponse.json(
      { message: "Du hast dich erfolgreich registriert!", user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
