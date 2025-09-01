import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Pair from "@/models/Pair";
import Session from "@/models/Session";
import Feedback from "@/models/Feedback";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  
  // ユーザー情報を取得
  const user = await User.findById(id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // その人物がマネージャーとして参加しているペアを取得
  const pairs = await Pair.find({ managerId: id })
    .populate({ path: "memberId", model: "User" })
    .lean();

  // その人物の1on1セッション履歴を取得
  const sessions = await Session.find({ pairId: { $in: pairs.map(p => p._id) } })
    .sort({ scheduledAt: -1 })
    .populate({
      path: "pairId",
      populate: [
        { path: "managerId", model: "User" },
        { path: "memberId", model: "User" }
      ]
    })
    .lean();

  // 各セッションのフィードバックを取得
  const sessionsWithFeedback = await Promise.all(
    sessions.map(async (session: any) => {
      const feedback = await Feedback.find({ sessionId: session._id })
        .populate({ path: "userId", model: "User" })
        .lean();
      return { ...session, feedback };
    })
  );

  return NextResponse.json({
    user,
    pairs,
    sessions: sessionsWithFeedback,
    stats: {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === "completed").length,
      totalMentees: pairs.length,
      avgRating: sessionsWithFeedback.reduce((acc: number, s: any) => {
        const ratings = s.feedback?.map((f: any) => f.rating) || [];
        return acc + (ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0);
      }, 0) / sessionsWithFeedback.length || 0
    }
  });
}