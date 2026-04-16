import { UserForm } from "../UserForm";
import { createUser } from "../actions";

export default function NewUserPage() {
  return (
    <div className="py-6 animate-fade-in">
      <UserForm action={createUser} />
    </div>
  );
}
