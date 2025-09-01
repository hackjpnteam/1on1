import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PersonRating from "@/models/PersonRating";
import User from "@/models/User";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  
  const ratings = await PersonRating.find({ personId: id })
    .sort({ createdAt: -1 })
    .populate({ path: "ratedById", model: "User" })
    .lean();
  
  return NextResponse.json(ratings);
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  const body = await req.json();
  
  const rating = await PersonRating.create({
    personId: id,
    ratedById: body.ratedById,
    rating: body.rating,
    comment: body.comment,
    category: body.category || "overall"
  });
  
  return NextResponse.json(rating, { status: 201 });
}