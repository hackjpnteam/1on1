import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL?.replace(//$/, "")}/api/calendar/callback`
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, department, isMentor, bio, expertise } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "必須項目を入力してください" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      name,
      email,
      password: hashedPassword,
      department: department || "",
      role: isMentor ? "mentor" : "member",
      isMentor: isMentor || false,
    };

    if (isMentor) {
      userData.bio = bio || "";
      userData.expertise = expertise || [];
    }

    const user = await User.create(userData);

    let googleAuthUrl = null;
    if (isMentor) {
      const scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
      ];

      googleAuthUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: user._id.toString(),
        prompt: "consent",
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isMentor: user.isMentor,
      },
      googleAuthUrl,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "登録中にエラーが発生しました" },
      { status: 500 }
    );
  }
}