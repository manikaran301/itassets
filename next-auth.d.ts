import { DefaultSession } from "next-auth";
import { SystemRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: SystemRole;
    };
  }

  interface User {
    id: string;
    role: SystemRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: SystemRole;
  }
}
