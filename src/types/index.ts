import type { Task, Project, User, TaskStatus, Role } from "@prisma/client";

export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name" | "email">;
  project: Pick<Project, "id" | "name">;
};

export type ProjectWithRelations = Project & {
  owner: Pick<User, "id" | "name" | "email">;
  members: Array<{ user: Pick<User, "id" | "name" | "email"> }>;
  _count: { tasks: number };
};

export { TaskStatus, Role };
