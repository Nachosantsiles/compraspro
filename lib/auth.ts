import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { RolEnum } from "@/types";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { empresa: true },
        });

        if (!user || !user.activo) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.nombre} ${user.apellido}`,
          rol: user.rol as RolEnum,
          empresaId: user.empresaId ?? undefined,
          empresaNombre: user.empresa?.nombre ?? undefined,
          empresaColor: user.empresa?.color ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
        token.empresaId = (user as any).empresaId;
        token.empresaNombre = (user as any).empresaNombre;
        token.empresaColor = (user as any).empresaColor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
        (session.user as any).empresaId = token.empresaId;
        (session.user as any).empresaNombre = token.empresaNombre;
        (session.user as any).empresaColor = token.empresaColor;
      }
      return session;
    },
  },
};
