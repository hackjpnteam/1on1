import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/calendar/callback`
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(new URL("/profile?error=missing_params", req.url));
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary) || calendarList.data.items?.[0];

    await dbConnect();
    
    await User.findByIdAndUpdate(state, {
      googleCalendarId: primaryCalendar?.id,
      googleRefreshToken: tokens.refresh_token,
    });

    await syncAvailability(state, oauth2Client);

    return NextResponse.redirect(new URL("/profile?sync=success", req.url));
  } catch (error) {
    console.error("Google calendar callback error:", error);
    return NextResponse.redirect(new URL("/profile?error=calendar_sync_failed", req.url));
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
    
    console.log(`Synced ${availableSlots.length} available slots for user ${userId}`);
    
    await User.findByIdAndUpdate(userId, {
      availableSlots,
    });
  } catch (error) {
    console.error("Sync availability error:", error);
    throw error;
  }
}