import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");

  const tasks = await prisma.task.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(session.user.role === "MEMBER"
        ? { assigneeId: session.user.id }
        : assigneeId ? { assigneeId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can create tasks" }, { status: 403 });

  const { title, description, projectId, assigneeId, dueDate, status } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: "Project is required" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      projectId,
      assigneeId: assigneeId || null,
      creatorId: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || "TODO",
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (task.assigneeId && task.assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        message: `You have been assigned a new task: "${task.title}" in ${task.project.name}.`,
        fromUserId: session.user.id,
        toUserId: task.assigneeId,
      },
    });
  }

  return NextResponse.json({ task }, { status: 201 });
}
