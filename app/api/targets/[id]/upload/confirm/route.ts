import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Target } from "@/models";
import mongoose from "mongoose";

// POST /api/targets/[id]/upload/confirm - Confirm successful uploads and update database
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Decode base64 token to get user data
    let userData;
    try {
      const decodedToken = Buffer.from(token, "base64").toString("utf-8");
      userData = JSON.parse(decodedToken);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    if (!userData.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if target exists and belongs to user
    const target = await Target.findOne({
      _id: params.id,
      assignedTo: new mongoose.Types.ObjectId(userData.userId),
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const body = await request.json();
    const { uploadedFiles } = body;

    if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
      return NextResponse.json(
        { error: "Uploaded files array is required" },
        { status: 400 }
      );
    }

    // Validate file count
    const totalFilesAfterUpload = target.files.length + uploadedFiles.length;
    if (totalFilesAfterUpload > target.documentCount) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum allowed: ${target.documentCount}. Current: ${target.files.length}, uploaded: ${uploadedFiles.length}`,
        },
        { status: 400 }
      );
    }

    // Prepare files for database storage
    const filesToStore = uploadedFiles.map((file: any) => ({
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadedAt: new Date(),
    }));

    // Update target with new files
    const updatedTarget = await Target.findByIdAndUpdate(
      params.id,
      {
        $push: { files: { $each: filesToStore } },
      },
      { new: true }
    );

    // Check if all required files are now uploaded and update status to submitted
    if (
      updatedTarget &&
      updatedTarget.files.length >= updatedTarget.documentCount
    ) {
      await Target.findByIdAndUpdate(
        params.id,
        { status: "submitted" },
        { new: true }
      );
    }

    return NextResponse.json({
      message: "Files confirmed and stored successfully",
      target: updatedTarget,
      uploadedFiles: filesToStore,
    });
  } catch (error) {
    console.error("Error confirming uploads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
