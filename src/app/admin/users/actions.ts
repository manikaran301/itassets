'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { SystemRole } from "@prisma/client";

export async function createUser(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as SystemRole;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;
  const isActive = formData.get("isActive") === "on";
  const permissionsJson = formData.get("permissions") as string;

  if (!fullName || !username || !email || !role || !password) {
    throw new Error("Missing required fields");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.systemUser.create({
    data: {
      fullName,
      username,
      email,
      role,
      passwordHash,
      companyName: companyName || null,
      isActive,
    },
  });

  // Handle Permissions
  if (permissionsJson) {
    try {
      const perms = JSON.parse(permissionsJson);
      if (Array.isArray(perms) && perms.length > 0) {
        await prisma.userPermission.createMany({
          data: perms.map((p: any) => ({
            userId: user.id,
            category: p.category,
            subcategory: p.subcategory,
            canView: !!p.canView,
            canCreate: !!p.canCreate,
            canEdit: !!p.canEdit,
            canDelete: !!p.canDelete,
            canImport: !!p.canImport,
            canExport: !!p.canExport,
          }))
        });
      }
    } catch (error) {
      console.error("Failed to create initial permissions:", error);
    }
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as SystemRole;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;
  const isActive = formData.get("isActive") === "on";

  if (!fullName || !username || !email || !role) {
    throw new Error("Missing required fields");
  }

  const updateData: {
    fullName: string;
    username: string;
    email: string;
    role: SystemRole;
    companyName: string | null;
    isActive: boolean;
    updatedAt: Date;
    passwordHash?: string;
  } = {
    fullName,
    username,
    email,
    role,
    companyName: companyName || null,
    isActive,
    updatedAt: new Date(),
  };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.systemUser.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
