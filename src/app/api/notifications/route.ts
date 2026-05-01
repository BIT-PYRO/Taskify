import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    // Admin sees inbound resignation requests
    const notifications = await prisma.notification.findMany({
      where: { toUserId: null },
      include: { fromUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notifications });
  } else {
    // Members see notifications sent to them
    const notifications = await prisma.notification.findMany({
      where: { toUserId: session.user.id },
      include: { fromUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notifications });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, message, toUserId } = await req.json();
  if (!message?.trim())
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const notification = await prisma.notification.create({
    data: {
      type: type || "RESIGNATION_REQUEST",
      message: message.trim(),
      fromUserId: session.user.id,
      ...(toUserId ? { toUserId } : {}),
    },
    include: { fromUser: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ notification }, { status: 201 });
}
