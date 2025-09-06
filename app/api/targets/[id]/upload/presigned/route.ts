import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Target } from "@/models";
import { S3Service } from "@/lib/s3";
import mongoose from "mongoose";

// POST /api/targets/[id]/upload/presigned - Generate presigned URLs for direct upload
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
    const { files } = body;

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Files array is required" },
        { status: 400 }
      );
    }

    // Validate file count
    const totalFilesAfterUpload = target.files.length + files.length;
    if (totalFilesAfterUpload > target.documentCount) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum allowed: ${target.documentCount}. Current: ${target.files.length}, trying to upload: ${files.length}`,
        },
        { status: 400 }
      );
    }

    const presignedUrls = [];

    for (const file of files) {
      try {
        // Generate a stable key first so presigned URL and stored URL match
        const key = `targets/${userData.userId}/${Date.now()}-${file.fileName}`;
        // Generate presigned URL for this exact key
        const presignedUrl = await S3Service.generateUploadUrlForKey(
          key,
          file.fileType
        );

        // Generate the final file URL
        const fileUrl = S3Service.getFileUrl(key);

        presignedUrls.push({
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          presignedUrl,
          fileUrl,
          key,
        });
      } catch (error) {
        console.error(
          "Error generating presigned URL for file:",
          file.fileName,
          error
        );
        return NextResponse.json(
          { error: `Failed to generate upload URL for ${file.fileName}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      presignedUrls,
      message: "Presigned URLs generated successfully",
    });
  } catch (error) {
    console.error("Error generating presigned URLs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
