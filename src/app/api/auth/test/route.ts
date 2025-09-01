import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
    expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
  });
}