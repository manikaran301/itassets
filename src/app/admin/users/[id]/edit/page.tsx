import { UserForm } from "../../UserForm";
import { updateUser } from "../../actions";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await prisma.systemUser.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!user) {
    notFound();
  }

  // Bind the ID to the Server Action
  const updateAction = updateUser.bind(null, user.id);

  return (
    <div className="py-6 animate-fade-in">
      <UserForm initialData={user} action={updateAction} />
    </div>
  );
}
