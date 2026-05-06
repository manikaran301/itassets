import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();

        if (!identifier || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.systemUser.findFirst({
            where: {
              OR: [
                { email: identifier },
                { username: identifier }
              ]
            },
            include: {
              managedLocations: {
                select: { id: true, name: true }
              }
            }
          });

          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordCorrect) {
            return null;
          }

          // Update last login timestamp
          await prisma.systemUser.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            companyId: user.companyId,
            defaultLocationId: user.defaultLocationId,
            authorizedLocations: user.managedLocations.map(loc => ({ id: loc.id, name: loc.name })),
          };
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.companyId = user.companyId;
        token.defaultLocationId = user.defaultLocationId;
        token.authorizedLocations = user.authorizedLocations;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.companyId = token.companyId;
        session.user.defaultLocationId = token.defaultLocationId;
        session.user.authorizedLocations = token.authorizedLocations;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
