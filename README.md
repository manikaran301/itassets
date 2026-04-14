# M_AMS (The Asset Management System) █ 2026 Edition

A premium, next-generation Asset Management System (AMS) built with the 2026 state-of-the-art tech stack. Designed for modern HR, IT, and Admin teams to manage enterprise identities and infrastructure.

## 🚀 Architectural Vision & Tech Stack

This project follows the architecture defined in `full_stack_architecture.svg`:

- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript 5. 
- **Styling**: Tailwind CSS 4 with custom premium design tokens and glassmorphism components.
- **Backend**: Next.js API Routes (Serverless ready).
- **ORM**: Prisma 7 for PostgreSQL with full type safety.
- **Auth**: NextAuth.js (Auth.js) with role-based access control.
- **Jobs**: `node-cron` for automated hardware health pings and warranty alerts.
- **Notifications**: `Nodemailer` for IT and HR workflow alerts.

## 🏗 Directory Structure

- `src/app/`: Logic and routing for modules:
  - `(dashboard)`: Real-time metrics and analytics.
  - `hr/`: Employee directory, joiners, exits, and seating management.
  - `it/`: Asset lifecycle, provisioning, assignments, and email identities.
  - `admin/`: Audit logs, system reports, and user management.
- `src/components/`: Reusable premium UI components (StatsCard, Sidebar, Tables, Forms).
- `src/lib/`: Core singletons (Prisma client, Auth configuration, Utils).
- `prisma/`: Database schema, migrations, and seed data.
- `jobs/`: Background service definitions for scheduling tasks.

## 🛠 Getting Started

1. **Environment Setup**:
   Copy `.env.example` to `.env` and provide your PostgreSQL connection string.
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/m_ams"
   ```

2. **Initialize Database**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

3. **Development Mode**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

## 🔒 Security & Auditing

Every action in the system is automatically recorded in the `audit_log` table with point-in-time state comparisons, providing an immutable record for compliance.

---
Built with ❤️ by **Antigravity** (2026-04-02)
