import { LucideIcon } from "lucide-react";

// Audit Log types
export interface AuditLog {
  id: bigint | string;
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: Date | string;
  user?: {
    fullName: string;
  } | null;
}

// Entity icon type
export type EntityIconMap = Record<string, LucideIcon>;

// System User update data
export interface SystemUserUpdateData {
  fullName: string;
  username: string;
  email: string;
  role: string;
  companyName: string | null;
  isActive: boolean;
  updatedAt: Date;
  passwordHash?: string;
}

// Form data types
export interface EmployeeFormData {
  fullName: string;
  employeeCode: string;
  personalEmail: string;
  personalPhone: string;
  department: string;
  designation: string;
  companyName: string;
  reportingManagerId: string;
  locationJoining: string;
  deskNumber: string;
  startDate: string;
  exitDate: string;
  status: string;
}

export interface AssetFormData {
  assetTag: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  cpu: string;
  ramGb: number;
  ssdGb: number;
  hddGb: number;
  ipAddress: string;
  macAddress: string;
  wifiMacAddress: string;
  purchaseDate: string;
  purchaseCost: number;
  invoiceNumber: string;
  poNumber: string;
  vendorName: string;
  antivirus: string;
  msOfficeVersion: string;
  osVersion: string;
  status: string;
  condition: string;
  currentEmployeeId: string;
  notes: string;
}

export interface EmailFormData {
  emailAddress: string;
  displayName: string;
  accountType: string;
  platform: string;
  employeeId: string;
  status: string;
}
