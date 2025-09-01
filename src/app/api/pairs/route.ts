import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Pair from "@/models/Pair";
import User from "@/models/User";

export async function GET() {
  await dbConnect();
  const pairs = await Pair.find()
    .populate({ path: "managerId", model: "User" })
    .populate({ path: "memberId", model: "User" })
    .lean();
  return NextResponse.json(pairs);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const created = await Pair.create(body);
  return NextResponse.json(created, { status: 201 });
}