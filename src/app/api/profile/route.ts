import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, bio, expertise, department, role, image } = body;

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

    // Update user profile
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) {
      updateData.role = role;
      // メンターロールに設定された場合はisMentorもtrueにする
      if (role === "mentor") {
        updateData.isMentor = true;
      }
    }
    if (image !== undefined) updateData.image = image;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isMentor: updatedUser.isMentor,
        bio: updatedUser.bio,
        expertise: updatedUser.expertise,
        department: updatedUser.department,
        image: updatedUser.image,
        googleCalendarId: updatedUser.googleCalendarId,
        availableSlots: updatedUser.availableSlots,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "プロフィール更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}