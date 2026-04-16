import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();

        console.log("Login attempt with:", identifier);
        
        if (!identifier || !credentials?.password) {
          console.warn("Login rejected: missing identifier or password");
          return null;
        }

        try {
          const user = await prisma.systemUser.findFirst({
            where: {
              OR: [
                { email: identifier },
                { username: identifier }
              ]
            }
          });
          
          console.log("DB lookup returned:", user ? user.email : "Not found");

          if (!user || !user.isActive) {
            console.warn("Login rejected: user not found or inactive");
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          
          console.log("Password match:", isPasswordCorrect);

          if (!isPasswordCorrect) {
            console.warn("Login rejected: invalid password");
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
          };
        } catch (error) {
          console.error("Credentials authorize failed:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
});

export { handler as GET, handler as POST };
