import {
  BarChart3,
  HardDrive,
  History,
  Layout,
  Mail,
  Monitor,
  PlaneTakeoff,
  Settings,
  Truck,
  Users,
  UserCheck,
  UserX,
  ArrowRightLeft,
  type LucideIcon,
} from "lucide-react";

export type PermissionAction =
  | "canView"
  | "canCreate"
  | "canEdit"
  | "canDelete"
  | "canImport"
  | "canExport";

export interface PermissionPage {
  category: string;
  subcategory: string;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  actions?: PermissionAction[];
}

export const PERMISSION_ACTIONS: Array<{
  id: PermissionAction;
  label: string;
  shortLabel: string;
}> = [
  { id: "canView", label: "View page", shortLabel: "View" },
  { id: "canCreate", label: "Create records", shortLabel: "Create" },
  { id: "canEdit", label: "Edit records", shortLabel: "Edit" },
  { id: "canDelete", label: "Delete records", shortLabel: "Delete" },
  { id: "canImport", label: "Import data", shortLabel: "Import" },
  { id: "canExport", label: "Export data", shortLabel: "Export" },
];

export const PERMISSION_GROUPS: Array<{
  category: string;
  label: string;
  pages: PermissionPage[];
}> = [
  {
    category: "IT",
    label: "IT Module",
    pages: [
      {
        category: "IT",
        subcategory: "ASSETS",
        label: "Assets",
        href: "/it/assets",
        description: "Hardware registry, assignment, import, and export tools.",
        icon: Monitor,
      },
      {
        category: "IT",
        subcategory: "ACCESSORIES",
        label: "Accessories",
        href: "/it/accessories",
        description: "Accessory inventory and allocation records.",
        icon: HardDrive,
      },
      {
        category: "IT",
        subcategory: "EMAILS",
        label: "Email Accounts",
        href: "/it/email",
        description: "Workspace identities, forwarding, and account lifecycle.",
        icon: Mail,
      },
      {
        category: "IT",
        subcategory: "PROVISIONING",
        label: "Provisioning",
        href: "/it/provisioning",
        description: "Employee provisioning requests and fulfillment workflow.",
        icon: Truck,
        actions: ["canView", "canEdit", "canExport"],
      },
      {
        category: "IT",
        subcategory: "ASSIGNMENTS",
        label: "Assignments",
        href: "/it/assignments",
        description: "Asset and accessory assignment movement ledger.",
        icon: ArrowRightLeft,
        actions: ["canView", "canExport"],
      },
    ],
  },
  {
    category: "HR",
    label: "HR Module",
    pages: [
      {
        category: "HR",
        subcategory: "EMPLOYEES",
        label: "Employees",
        href: "/hr/employees",
        description: "Employee directory and lifecycle records.",
        icon: Users,
      },
      {
        category: "HR",
        subcategory: "JOINERS",
        label: "Onboarding",
        href: "/hr/joiners",
        description: "New joiner onboarding workflow.",
        icon: UserCheck,
      },
      {
        category: "HR",
        subcategory: "REQUIREMENTS",
        label: "Upcoming Joinings",
        href: "/hr/upcoming",
        description: "Scheduled upcoming joiners.",
        icon: PlaneTakeoff,
      },
      {
        category: "HR",
        subcategory: "EXITS",
        label: "Exits",
        href: "/hr/exits",
        description: "Notice period, exit, and recovery pipeline.",
        icon: UserX,
      },
    ],
  },
  {
    category: "FACILITY",
    label: "Facility",
    pages: [
      {
        category: "FACILITY",
        subcategory: "SEATS",
        label: "Seats Registry",
        href: "/seats",
        description: "Workspace and seating allocation.",
        icon: Layout,
      },
    ],
  },
  {
    category: "ADMIN",
    label: "Management",
    pages: [
      {
        category: "ADMIN",
        subcategory: "USERS",
        label: "Users",
        href: "/admin/users",
        description: "User accounts and security matrix.",
        icon: Settings,
      },
      {
        category: "ADMIN",
        subcategory: "AUDIT",
        label: "Audit Log",
        href: "/admin/audit",
        description: "System activity and change history.",
        icon: History,
      },
      {
        category: "ADMIN",
        subcategory: "REPORTS",
        label: "Reports",
        href: "/admin/reports",
        description: "Operational reports and exports.",
        icon: BarChart3,
      },
    ],
  },
];

export const PERMISSION_PAGES = PERMISSION_GROUPS.flatMap((group) => group.pages);

export function getPagePermission(href: string) {
  return PERMISSION_PAGES.find((page) => href === page.href || href.startsWith(`${page.href}/`));
}
