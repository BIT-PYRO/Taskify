Taskify
A task management app built with Next.js 14, PostgreSQL, Prisma, and Tailwind CSS. Two roles — Admin and Member — with different views and permissions for managing projects, tasks, and team members.

What it does
Admins create projects, add team members, assign tasks, and manage the whole team. Members see their own tasks, update task statuses, and can submit a resignation request. There's an in-app notification system so members get pinged when assigned a task or when their resignation request status changes.

Admin
- Dashboard with task stats by status and an overdue alert
- Create and delete projects, assign team members from a dropdown
- Create tasks and assign them to members — assignee gets notified automatically
- Kanban board per project (To Do → In Progress → In Review → Done)
- Team page with role toggling (Admin ↔ Member) and user deletion
- Notifications page showing resignation requests with Approve / Reject / Under Review actions — member gets notified on every status change

Member
- Dashboard showing only their assigned tasks
- Can update the status of tasks assigned to them
- Team page is read-only but has a Request Resignation button
- Notifications feed for task assignments and resignation status updates
- Bell icon in the sidebar with a live unread count (polls every 30 seconds)

---

Stack

- Next.js 14 (App Router, TypeScript)
- PostgreSQL hosted on Railway
- Prisma 5 as the ORM
- NextAuth.js 4 with Credentials provider and JWT sessions
- Tailwind CSS 3 with a dark zinc + violet palette
- Lucide React for icons

Getting started
You'll need Node 18+ and a PostgreSQL database.

\\\ash
git clone https://github.com/your-username/taskify.git
cd taskify
npm install
\\\

Copy \.env.example\ to \.env\ and fill in your values (see below), then:

\\\ash
npm run db:push   # sync the schema to your database
npm run dev       # start on localhost:3000
\\\

The first time you run it, create a user via the register page. To make them an Admin, open Prisma Studio (\
pm run db:studio\) and update their role manually.

Environment variables
\\\env
DATABASE_URL="postgresql://user:password@host:port/database"

generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret"

NEXTAUTH_URL="http://localhost:3000"
\\\

Scripts
\\\ash
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run start        # production server
npm run db:push      # push schema changes to the database
npm run db:studio    # Prisma Studio GUI
\\\


How auth works
NextAuth with a Credentials provider. Passwords are hashed with bcryptjs. The JWT session carries the user's id and role so both client components and API routes can check who's logged in. Every app page sits under (app)/layout.tsx which redirects unauthenticated users to /auth/login.

How notifications work

Three notification types:

- RESIGNATION_REQUEST — created when a member submits a resignation. Addressed to admins (toUserId is null).
- RESIGNATION_RESPONSE — auto-created when an admin changes the request status (Under Review / Approved / Rejected). Sent to the member.
- TASK_ASSIGNED — created when an admin assigns or reassigns a task. Sent to the assignee.

The admin's /notifications page shows all inbound resignation requests. Members see their own feed at the same route. Both get a live unread badge in the sidebar.

Project structure
\\\
src/
  app/
    (app)/              protected shell — auth guard lives in layout.tsx
      dashboard/        task overview with stats and filters
      projects/         project list and per-project kanban board
      users/            team management
      notifications/    notification feed (works for both roles)
    api/                REST endpoints
    auth/               login and register pages
  components/
    layout/Sidebar.tsx
    tasks/TaskCard.tsx
    tasks/CreateTaskModal.tsx
    projects/CreateProjectModal.tsx
    ui/                 Button, Input, Badge, Modal
  lib/
    auth.ts
    prisma.ts
    utils.ts
  types/index.ts
prisma/schema.prisma
\\\

Schema (quick overview)

User — email, passwordHash, role (ADMIN | MEMBER)
Project — name, description, owner, members, tasks
ProjectMember — joins a User to a Project
Task — title, status (TODO | IN_PROGRESS | IN_REVIEW | DONE), dueDate, assignee, creator
Notification — type, message, isRead, status (PENDING | UNDER_REVIEW | APPROVED | REJECTED), fromUser, toUser (null means it's addressed to admin)
