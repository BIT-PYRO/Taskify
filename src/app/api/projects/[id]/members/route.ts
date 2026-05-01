import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });

  const { email, userId } = await req.json();
  if (!email && !userId)
    return NextResponse.json({ error: "Email or userId is required" }, { status: 400 });

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: user.id } },
  });
  if (existing)
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });

  const member = await prisma.projectMember.create({
    data: { projectId: params.id, userId: user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { name: true } });
  if (project && user.id !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "PROJECT_ADDED",
        message: `You have been added to the project "${project.name}".`,
        fromUserId: session.user.id,
        toUserId: user.id,
      },
    });
  }

  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id: params.id }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);

  await prisma.projectMember.deleteMany({
    where: { projectId: params.id, userId },
  });

  if (project && user && userId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "PROJECT_REMOVED",
        message: `You have been removed from the project "${project.name}".`,
        fromUserId: session.user.id,
        toUserId: userId,
      },
    });
  }

  return NextResponse.json({ success: true });
}

