import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Feedback from "@/models/Feedback";
import Session from "@/models/Session";
import User from "@/models/User";

export async function GET(_req: Request, context: { params: Promise<{ sessionId: string }> }) {
  await dbConnect();
  const { sessionId } = await context.params;
  const feedback = await Feedback.find({ sessionId })
    .populate({ path: "userId", model: "User" })
    .lean();
  return NextResponse.json(feedback);
}