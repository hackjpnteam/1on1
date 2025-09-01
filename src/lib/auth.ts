import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "./db";
import User from "@/models/User";

export const authOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image
        };
      }
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  events: {
    async linkAccount({ user, account, profile }) {
      console.log("Account linked:", { user, account, profile });
    },
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        if (account?.provider === "google") {
          await dbConnect();
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user from Google account
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: "member",
              isMentor: false,
            });
          }
          
          // Update the user object with database ID
          user.id = existingUser._id.toString();
          user.role = existingUser.role;
        }
        
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return true; // Allow sign in even if DB operation fails
      }
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (user?.email) {
        const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase());
        if (admins.includes(user.email.toLowerCase())) token.role = "admin";
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        (session as any).user.id = token.id;
        (session as any).user.role = token.role || "member";
      }
      return session;
    },
  },
};