import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/calendar/callback`
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

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

    if (!user.isMentor && user.role !== "mentor") {
      return NextResponse.json(
        { error: "メンターのみがカレンダー同期を利用できます" },
        { status: 403 }
      );
    }

    // Check if already has Google Calendar access
    if (user.googleRefreshToken) {
      // Re-sync using existing token
      try {
        oauth2Client.setCredentials({
          refresh_token: user.googleRefreshToken,
        });

        await syncAvailability(user._id.toString(), oauth2Client);

        return NextResponse.json({
          success: true,
          message: "カレンダーの同期が完了しました",
        });
      } catch (error) {
        console.error("Refresh token error:", error);
        // If refresh fails, generate new auth URL
      }
    }

    // Generate new Google Auth URL
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
      googleAuthUrl,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "カレンダー同期中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

async function syncAvailability(userId: string, auth: any) {
  try {
    const calendar = google.calendar({ version: "v3", auth });
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: nextWeek.toISOString(),
        items: [{ id: "primary" }],
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    
    const availableSlots = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() + i);
      dayStart.setHours(9, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(18, 0, 0, 0);
      
      const dayBusySlots = busySlots.filter((slot: any) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        return slotStart >= dayStart && slotEnd <= dayEnd;
      });
      
      if (dayBusySlots.length === 0) {
        availableSlots.push({
          dayOfWeek: dayStart.getDay(),
          startTime: "09:00",
          endTime: "18:00",
        });
      } else {
        let currentTime = dayStart;
        
        for (const busySlot of dayBusySlots) {
          const busyStart = new Date(busySlot.start);
          
          if (currentTime < busyStart && (busyStart.getTime() - currentTime.getTime()) >= 60 * 60 * 1000) {
            availableSlots.push({
              dayOfWeek: dayStart.getDay(),
              startTime: `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`,
              endTime: `${busyStart.getHours().toString().padStart(2, "0")}:${busyStart.getMinutes().toString().padStart(2, "0")}`,
            });
          }
          
          currentTime = new Date(busySlot.end);
        }
        
        if (currentTime < dayEnd && (dayEnd.getTime() - currentTime.getTime()) >= 60 * 60 * 1000) {
          availableSlots.push({
            dayOfWeek: dayStart.getDay(),
            startTime: `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`,
            endTime: "18:00",
          });
        }
      }
    }
    
    await User.findByIdAndUpdate(userId, {
      availableSlots,
    });
  } catch (error) {
    console.error("Sync availability error:", error);
    throw error;
  }
}