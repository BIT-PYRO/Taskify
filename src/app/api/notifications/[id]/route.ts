import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_MESSAGES: Record<string, string> = {
  UNDER_REVIEW: "Your resignation request is now under review.",
  APPROVED: "Your resignation request has been approved.",
  REJECTED: "Your resignation request has been rejected.",
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notification = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (session.user.role === "ADMIN") {
    const updateData: Record<string, any> = {};
    if (body.isRead !== undefined) updateData.isRead = body.isRead;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: updateData,
    });

    // Send a response notification to the member when status changes
    if (body.status && STATUS_MESSAGES[body.status]) {
      await prisma.notification.create({
        data: {
          type: "RESIGNATION_RESPONSE",
          message: STATUS_MESSAGES[body.status],
          fromUserId: session.user.id,
          toUserId: notification.fromUserId,
        },
      });
    }

    return NextResponse.json({ notification: updated });
  } else {
    // Member: can only mark their own notification as read
    if (notification.toUserId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });
    return NextResponse.json({ notification: updated });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.notification.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
