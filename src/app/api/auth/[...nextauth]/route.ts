import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic';

// Create the NextAuth handler
const handler = NextAuth(authOptions)

// Export GET and POST handlers directly (App Router compatible)
export { handler as GET, handler as POST }
