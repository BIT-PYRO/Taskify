import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const isMember = session.user.role === "MEMBER";
  const isAssignee = task.assigneeId === session.user.id;

  if (isMember && !isAssignee)
    return NextResponse.json({ error: "You can only update tasks assigned to you" }, { status: 403 });

  const body = await req.json();
  const allowedFields = isMember
    ? ["status"]
    : ["title", "description", "status", "assigneeId", "dueDate"];
  const updateData: Record<string, any> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "status" && !Object.values(TaskStatus).includes(body[field]))
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      updateData[field] =
        field === "dueDate" && body[field] ? new Date(body[field]) : body[field];
    }
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (
    updateData.assigneeId &&
    updateData.assigneeId !== task.assigneeId &&
    updateData.assigneeId !== session.user.id
  ) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        message: `You have been assigned a task: "${updated.title}" in ${updated.project.name}.`,
        fromUserId: session.user.id,
        toUserId: updateData.assigneeId,
      },
    });
  }

  return NextResponse.json({ task: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Only admins can delete tasks" }, { status: 403 });

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
