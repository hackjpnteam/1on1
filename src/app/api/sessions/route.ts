import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Session from "@/models/Session";
import Pair from "@/models/Pair";
import User from "@/models/User";

export async function GET() {
  await dbConnect();
  const sessions = await Session.find()
    .sort({ scheduledAt: -1 })
    .populate({
      path: "pairId",
      populate: [
        { path: "managerId", model: "User" },
        { path: "memberId", model: "User" }
      ]
    })
    .lean();
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  console.log("Creating session with body:", body);
  
  const created = await Session.create(body);
  console.log("Created session:", created);
  
  // 作成後にpopulateして返す
  const populatedSession = await Session.findById(created._id)
    .populate({
      path: "pairId",
      populate: [
        { path: "managerId", model: "User" },
        { path: "memberId", model: "User" }
      ]
    });
  
  console.log("Populated session:", populatedSession);
  return NextResponse.json(populatedSession, { status: 201 });
}