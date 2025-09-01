import { NextRequest, NextResponse } from "next/server";
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
    const { email, bio, expertise, department } = body;

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // Update user to mentor
    user.role = "mentor";
    user.isMentor = true;
    user.bio = bio || "";
    user.expertise = expertise || [];
    user.department = department || "";
    
    await user.save();

    // Generate Google Auth URL for calendar integration
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ];

    const googleAuthUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: user._id.toString(),
      prompt: "consent",
    });

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
    console.error("Mentor upgrade error:", error);
    return NextResponse.json(
      { error: "メンター登録中にエラーが発生しました" },
      { status: 500 }
    );
  }
}