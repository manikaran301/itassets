// =============================================================================
// MAMS Type Definitions
// =============================================================================

import type { 
  Employee as PrismaEmployee,
  Asset as PrismaAsset,
  Accessory as PrismaAccessory,
  EmailAccount as PrismaEmailAccount,
  SystemUser as PrismaSystemUser,
  AssignmentHistory as PrismaAssignmentHistory,
  ProvisioningRequest as PrismaProvisioningRequest,
} from '@prisma/client';

// =============================================================================
// Employee Types
// =============================================================================

export type Employee = PrismaEmployee & {
  manager?: Pick<PrismaEmployee, 'id' | 'fullName' | 'employeeCode'> | null;
  creator?: Pick<PrismaSystemUser, 'id' | 'fullName'> | null;
};

export type EmployeeListItem = Pick<PrismaEmployee,
  'id' | 'employeeCode' | 'fullName' | 'department' | 'designation' |
  'status' | 'startDate' | 'deskNumber' | 'companyName' | 'locationJoining' | 'photoPath'
> & {
  manager?: Pick<PrismaEmployee, 'id' | 'fullName' | 'employeeCode'> | null;
  workspace?: { code: string; floor: string } | null;
  emailAccounts?: PrismaEmailAccount[];
};

// =============================================================================
// Asset Types
// =============================================================================

export type AssetCurrentEmployee = Pick<PrismaEmployee, 
  'id' | 'fullName' | 'employeeCode' | 'deskNumber' | 'photoPath' | 'department'
> & {
  workspace?: { code: string } | null;
  manager?: { fullName: string } | null;
};

export type Asset = PrismaAsset & {
  currentEmployee?: AssetCurrentEmployee | null;
  creator?: Pick<PrismaSystemUser, 'id' | 'fullName'> | null;
};

export type AssetListItem = Pick<PrismaAsset,
  'id' | 'assetTag' | 'type' | 'make' | 'model' | 'serialNumber' |
  'cpu' | 'ramGb' | 'ssdGb' | 'hddGb' | 'ipAddress' | 'status'
> & {
  currentEmployee?: AssetCurrentEmployee | null;
  creator?: Pick<PrismaSystemUser, 'id' | 'fullName'> | null;
  workspace?: { code: string; floor: string } | null;
};

// =============================================================================
// Accessory Types
// =============================================================================

export type Accessory = PrismaAccessory & {
  currentEmployee?: AssetCurrentEmployee | null;
};

// =============================================================================
// Email Account Types
// =============================================================================

export type EmailAccountEmployee = Pick<PrismaEmployee, 'id' | 'fullName' | 'employeeCode' | 'photoPath' | 'locationJoining'>;

export type EmailAccount = PrismaEmailAccount & {
  employee?: EmailAccountEmployee | null;
};

export type EmailAccountListItem = Pick<PrismaEmailAccount,
  'id' | 'emailAddress' | 'displayName' | 'accountType' | 'status' | 'platform' | 'forwardingEnabled' | 'employeeId'
> & {
  employee?: EmailAccountEmployee | null;
  forwardingCount?: number;
};

// =============================================================================
// System User Types
// =============================================================================

export type SystemUser = Omit<PrismaSystemUser, 'passwordHash'>;

// =============================================================================
// Assignment History Types
// =============================================================================

export type AssignmentHistoryItem = Pick<PrismaAssignmentHistory,
  'id' | 'logCode' | 'actionType' | 'assignedDate' | 'assetCategory'
> & {
  employee: Pick<PrismaEmployee, 'fullName'>;
  asset?: Pick<PrismaAsset, 'assetTag'> | null;
  accessory?: Pick<PrismaAccessory, 'assetTag'> | null;
};

// =============================================================================
// Provisioning Types
// =============================================================================

export type ProvisioningRequest = PrismaProvisioningRequest;

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccess<T> {
  data: T;
}
