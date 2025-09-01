import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Feedback from "@/models/Feedback";
import Session from "@/models/Session";
import User from "@/models/User";

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const upserted = await Feedback.findOneAndUpdate(
    { sessionId: body.sessionId, userId: body.userId },
    { $set: { rating: body.rating, comment: body.comment } },
    { upsert: true, new: true }
  );
  return NextResponse.json(upserted, { status: 201 });
}