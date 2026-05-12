import { UserForm } from "../../UserForm";
import { updateUser } from "../../actions";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const user = await prisma.systemUser.findUnique({
    where: { id: resolvedParams.id },
    include: {
      managedLocations: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch accessible companies separately
  const accessibleCompanies = await prisma.userCompanyAccess.findMany({
    where: { userId: user.id },
    select: { companyId: true },
  });

  // Bind the ID to the Server Action
  const updateAction = updateUser.bind(null, user.id);

  // Format user data for the form
  const formData = {
    ...user,
    managedLocations: user.managedLocations || [],
    accessibleCompanies: accessibleCompanies.map((a) => a.companyId),
  };

  return (
    <div className="py-6 animate-fade-in">
      <UserForm initialData={formData as any} action={updateAction} />
    </div>
  );
}
