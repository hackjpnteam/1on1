import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (!user.isMentor && user.role !== "mentor") {
      return NextResponse.json(
        { error: "このユーザーはメンターではありません" },
        { status: 400 }
      );
    }

    // 今週と来週の利用可能な時間スロットを生成
    const slots = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    for (let date = new Date(today); date <= nextWeek; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const availableForDay = user.availableSlots?.filter((slot: any) => slot.dayOfWeek === dayOfWeek) || [];
      
      availableForDay.forEach((slot: any) => {
        const startDateTime = new Date(date);
        const [startHour, startMinute] = slot.startTime.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        const endDateTime = new Date(date);
        const [endHour, endMinute] = slot.endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        // 1時間スロットに分割
        for (let time = new Date(startDateTime); time < endDateTime; time.setHours(time.getHours() + 1)) {
          // 過去の時間はスキップ
          if (time < new Date()) continue;
          
          slots.push({
            dateTime: time.toISOString(),
            date: time.toISOString().split('T')[0],
            time: time.toTimeString().slice(0, 5),
            dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][time.getDay()],
            available: true
          });
        }
      });
    }

    // 日時順にソート
    slots.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Available slots error:", error);
    return NextResponse.json(
      { error: "利用可能時間の取得に失敗しました" },
      { status: 500 }
    );
  }
}