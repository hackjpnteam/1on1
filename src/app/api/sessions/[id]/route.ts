import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Session from "@/models/Session";
import Pair from "@/models/Pair";
import User from "@/models/User";

export async function PATCH(_req: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  const updated = await Session.findByIdAndUpdate(id, { $set: await _req.json() }, { new: true });
  return NextResponse.json(updated);
}