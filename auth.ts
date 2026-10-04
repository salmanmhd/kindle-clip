import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db"
import { User } from "@/lib/models/User"
import { z } from "zod"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          await dbConnect()
          const user = await User.findOne({ email: email.toLowerCase() })
          if (!user) return null
          
          const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
          if (passwordsMatch) {
            return {
              id: user._id.toString(),
              email: user.email,
            }
          }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  }
})
