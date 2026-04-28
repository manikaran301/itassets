import {
  Lock,
  Shield,
  ShieldCheck,
  Unlock,
  Users,
  Edit2, // Added Edit icon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

const roleConfig = {
  admin: {
    icon: ShieldCheck,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  hr: {
    icon: Users,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  it: {
    icon: Shield,
    color: "bg-secondary/10 text-secondary border-secondary/20",
  },
  readonly: {
    icon: Lock,
    color: "bg-muted text-muted-foreground border-border",
  },
} as const;

export default async function UsersPage() {
  const users = await prisma.systemUser.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      companyName: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  const roleSummary = Object.entries(
    users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/50 backdrop-blur-xl px-6 py-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Governance Center
          </p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-black tracking-tighter">
              {users.length}
            </h1>
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
              Total User Accounts
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-primary">Status</p>
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
              {users.filter((user) => user.isActive).length} active,{" "}
              {users.filter((user) => !user.isActive).length} inactive
            </p>
          </div>
          <a
            href="/admin/users/new"
            className="px-5 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Add Member</span>
          </a>
        </div>
      </div>

      {roleSummary.slice(0, 2).map(([role, count]) => (
        <div
          key={role}
          className="premium-card rounded-[28px] border border-border bg-card p-5 hidden"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
            {role} accounts
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight">{count}</p>
        </div>
      ))}

      <div className="premium-card overflow-hidden rounded-[32px] border border-border bg-card">
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
            Access roster
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                  Identity
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                  Role
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                  Company
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                  Last login
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70">
                  Created
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/70 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const config = roleConfig[user.role];
                const RoleIcon = config.icon;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted/30 text-primary">
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] font-black tracking-[0.05em] text-muted-foreground/70">
                            @{user.username}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                          config.color,
                        )}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <>
                            <Unlock className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-black text-green-600">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-black text-red-600">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-muted-foreground">
                      {user.companyName || "Unassigned"}
                    </td>

                    <td className="px-6 py-5">
                      {user.lastLogin ? (
                        <div>
                          <p className="text-sm font-black tracking-tight">
                            {formatDistanceToNow(new Date(user.lastLogin), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                            {new Date(user.lastLogin).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          Never signed in
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-black tracking-tight">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/users/${user.id}/permissions`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Manage Permissions"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </a>
                        <a
                          href={`/admin/users/${user.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
