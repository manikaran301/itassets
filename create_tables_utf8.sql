-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'exit_pending', 'inactive');

-- CreateEnum
CREATE TYPE "AssetDeviceType" AS ENUM ('laptop', 'desktop', 'n_computing', 'nuc', 'server', 'other');

-- CreateEnum
CREATE TYPE "AccessoryType" AS ENUM ('mouse', 'keyboard', 'monitor', 'headset', 'docking_station', 'webcam', 'other');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('available', 'assigned', 'in_repair', 'retired', 'lost');

-- CreateEnum
CREATE TYPE "ConditionType" AS ENUM ('excellent', 'good', 'fair', 'needs_service', 'damaged');

-- CreateEnum
CREATE TYPE "AntivirusStatus" AS ENUM ('yes', 'no', 'expired');

-- CreateEnum
CREATE TYPE "RequirementAssetType" AS ENUM ('desktop', 'laptop', 'phone', 'tablet', 'sim');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('pending', 'approved', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "ProvisionStatus" AS ENUM ('pending', 'in_progress', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "ProvisionPriority" AS ENUM ('normal', 'urgent');

-- CreateEnum
CREATE TYPE "AssignmentAction" AS ENUM ('new_assignment', 'reassignment', 'recovery_exit', 'repair_send', 'repair_return');

-- CreateEnum
CREATE TYPE "EmailAccountType" AS ENUM ('personal', 'shared', 'alias', 'distribution', 'service');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('active', 'suspended', 'deactivated', 'deleted');

-- CreateEnum
CREATE TYPE "EmailPlatform" AS ENUM ('google_workspace', 'microsoft_365', 'zoho', 'other');

-- CreateEnum
CREATE TYPE "ForwardType" AS ENUM ('copy', 'redirect');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('hr', 'it', 'admin', 'readonly');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('employee', 'asset', 'accessory', 'email_account', 'assignment_history', 'provisioning_request', 'employee_asset_requirement', 'system_user');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('created', 'updated', 'deleted', 'status_changed');

-- CreateTable
CREATE TABLE "system_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "role" "SystemRole" NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeCode" VARCHAR(20) NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "personalEmail" VARCHAR(150),
    "personalPhone" VARCHAR(20),
    "department" VARCHAR(80),
    "designation" VARCHAR(80),
    "reportingManagerId" UUID,
    "locationJoining" VARCHAR(100),
    "deskNumber" VARCHAR(20),
    "startDate" DATE NOT NULL,
    "exitDate" DATE,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "createdBy" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_asset_requirements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "assetType" "RequirementAssetType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "specialNotes" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'pending',
    "fulfilledBy" UUID,
    "fulfilledAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_asset_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetTag" VARCHAR(30) NOT NULL,
    "type" "AssetDeviceType" NOT NULL,
    "make" VARCHAR(50),
    "model" VARCHAR(80),
    "cpu" VARCHAR(100),
    "ramGb" VARCHAR(10),
    "ssdGb" INTEGER,
    "hddGb" INTEGER,
    "serialNumber" VARCHAR(60),
    "macAddress" VARCHAR(17),
    "ipAddress" VARCHAR(15),
    "os" VARCHAR(30),
    "osVersion" VARCHAR(40),
    "antivirusStatus" "AntivirusStatus" NOT NULL DEFAULT 'no',
    "warrantyExpiry" DATE,
    "purchaseDate" DATE,
    "cost" DECIMAL(10,2),
    "status" "AssetStatus" NOT NULL DEFAULT 'available',
    "currentEmployeeId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetTag" VARCHAR(30) NOT NULL,
    "type" "AccessoryType" NOT NULL,
    "make" VARCHAR(50),
    "model" VARCHAR(80),
    "serialNumber" VARCHAR(60),
    "purchaseDate" DATE,
    "warrantyExpiry" DATE,
    "status" "AssetStatus" NOT NULL DEFAULT 'available',
    "currentEmployeeId" UUID,
    "condition" "ConditionType" NOT NULL DEFAULT 'good',
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "logCode" VARCHAR(20) NOT NULL,
    "assetId" UUID,
    "accessoryId" UUID,
    "employeeId" UUID NOT NULL,
    "assetCategory" VARCHAR(10) NOT NULL,
    "actionType" "AssignmentAction" NOT NULL,
    "assignedDate" DATE NOT NULL,
    "returnedDate" DATE,
    "assignedBy" UUID,
    "returnedBy" UUID,
    "conditionOnReturn" "ConditionType",
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provisioning_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestCode" VARCHAR(20) NOT NULL,
    "employeeId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "deviceTypeNeeded" "RequirementAssetType",
    "specialRequirements" TEXT,
    "priority" "ProvisionPriority" NOT NULL DEFAULT 'normal',
    "dueDate" DATE,
    "status" "ProvisionStatus" NOT NULL DEFAULT 'pending',
    "assignedAssetId" UUID,
    "emailProvisioned" VARCHAR(150),
    "fulfilledBy" UUID,
    "fulfilledAt" TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provisioning_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "accountType" "EmailAccountType" NOT NULL DEFAULT 'personal',
    "emailAddress" VARCHAR(150) NOT NULL,
    "displayName" VARCHAR(150) NOT NULL,
    "passwordHash" VARCHAR(255),
    "status" "EmailStatus" NOT NULL DEFAULT 'active',
    "forwardingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "previousUserId" UUID,
    "previousEmail" VARCHAR(150),
    "platform" "EmailPlatform" NOT NULL,
    "createdDate" DATE,
    "deactivatedDate" DATE,
    "createdBy" UUID,
    "deactivatedBy" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_forwarding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emailAccountId" UUID NOT NULL,
    "forwardToAddress" VARCHAR(150) NOT NULL,
    "forwardType" "ForwardType" NOT NULL DEFAULT 'copy',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP,

    CONSTRAINT "email_forwarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changedBy" UUID,
    "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" VARCHAR(45),

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_users_email_key" ON "system_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "employees"("department");

-- CreateIndex
CREATE INDEX "employees_reportingManagerId_idx" ON "employees"("reportingManagerId");

-- CreateIndex
CREATE INDEX "employees_locationJoining_idx" ON "employees"("locationJoining");

-- CreateIndex
CREATE INDEX "employee_asset_requirements_employeeId_idx" ON "employee_asset_requirements"("employeeId");

-- CreateIndex
CREATE INDEX "employee_asset_requirements_status_idx" ON "employee_asset_requirements"("status");

-- CreateIndex
CREATE INDEX "employee_asset_requirements_assetType_idx" ON "employee_asset_requirements"("assetType");

-- CreateIndex
CREATE UNIQUE INDEX "employee_asset_requirements_employeeId_assetType_key" ON "employee_asset_requirements"("employeeId", "assetType");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetTag_key" ON "assets"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serialNumber_key" ON "assets"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "assets_macAddress_key" ON "assets"("macAddress");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_currentEmployeeId_idx" ON "assets"("currentEmployeeId");

-- CreateIndex
CREATE INDEX "assets_warrantyExpiry_idx" ON "assets"("warrantyExpiry");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "assets_make_idx" ON "assets"("make");

-- CreateIndex
CREATE UNIQUE INDEX "accessories_assetTag_key" ON "accessories"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "accessories_serialNumber_key" ON "accessories"("serialNumber");

-- CreateIndex
CREATE INDEX "accessories_currentEmployeeId_idx" ON "accessories"("currentEmployeeId");

-- CreateIndex
CREATE INDEX "accessories_status_idx" ON "accessories"("status");

-- CreateIndex
CREATE INDEX "accessories_type_idx" ON "accessories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_history_logCode_key" ON "assignment_history"("logCode");

-- CreateIndex
CREATE INDEX "assignment_history_assetId_idx" ON "assignment_history"("assetId");

-- CreateIndex
CREATE INDEX "assignment_history_accessoryId_idx" ON "assignment_history"("accessoryId");

-- CreateIndex
CREATE INDEX "assignment_history_employeeId_idx" ON "assignment_history"("employeeId");

-- CreateIndex
CREATE INDEX "assignment_history_returnedDate_idx" ON "assignment_history"("returnedDate");

-- CreateIndex
CREATE INDEX "assignment_history_actionType_idx" ON "assignment_history"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "provisioning_requests_requestCode_key" ON "provisioning_requests"("requestCode");

-- CreateIndex
CREATE INDEX "provisioning_requests_employeeId_idx" ON "provisioning_requests"("employeeId");

-- CreateIndex
CREATE INDEX "provisioning_requests_status_idx" ON "provisioning_requests"("status");

-- CreateIndex
CREATE INDEX "provisioning_requests_dueDate_idx" ON "provisioning_requests"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_emailAddress_key" ON "email_accounts"("emailAddress");

-- CreateIndex
CREATE INDEX "email_accounts_employeeId_idx" ON "email_accounts"("employeeId");

-- CreateIndex
CREATE INDEX "email_accounts_status_idx" ON "email_accounts"("status");

-- CreateIndex
CREATE INDEX "email_accounts_previousUserId_idx" ON "email_accounts"("previousUserId");

-- CreateIndex
CREATE INDEX "email_forwarding_emailAccountId_idx" ON "email_forwarding"("emailAccountId");

-- CreateIndex
CREATE INDEX "email_forwarding_isActive_idx" ON "email_forwarding"("isActive");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_changedAt_idx" ON "audit_log"("changedAt");

-- CreateIndex
CREATE INDEX "audit_log_changedBy_idx" ON "audit_log"("changedBy");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_asset_requirements" ADD CONSTRAINT "employee_asset_requirements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_asset_requirements" ADD CONSTRAINT "employee_asset_requirements_fulfilledBy_fkey" FOREIGN KEY ("fulfilledBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_currentEmployeeId_fkey" FOREIGN KEY ("currentEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_currentEmployeeId_fkey" FOREIGN KEY ("currentEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "accessories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_returnedBy_fkey" FOREIGN KEY ("returnedBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_requests" ADD CONSTRAINT "provisioning_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_requests" ADD CONSTRAINT "provisioning_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "system_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_requests" ADD CONSTRAINT "provisioning_requests_assignedAssetId_fkey" FOREIGN KEY ("assignedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisioning_requests" ADD CONSTRAINT "provisioning_requests_fulfilledBy_fkey" FOREIGN KEY ("fulfilledBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_deactivatedBy_fkey" FOREIGN KEY ("deactivatedBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_forwarding" ADD CONSTRAINT "email_forwarding_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "email_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_forwarding" ADD CONSTRAINT "email_forwarding_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

