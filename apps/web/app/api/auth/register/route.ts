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

    return NextResponse.json(
      { message: "Du hast dich erfolgreich registriert!", user },
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
