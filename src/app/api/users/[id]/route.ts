import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can update users" }, { status: 403 });

  const { role, name } = await req.json();

  if (role && !["ADMIN", "MEMBER"].includes(role))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(role && { role }),
      ...(name !== undefined && { name: name?.trim() || null }),
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 });

  if (params.id === session.user.id)
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
