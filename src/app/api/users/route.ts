import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can create users" }, { status: 403 });

  const { email, password, name, role } = await req.json();

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (role && !["ADMIN", "MEMBER"].includes(role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing)
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), name: name?.trim() || null, passwordHash, role: role || "MEMBER" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
