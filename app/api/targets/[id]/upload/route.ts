import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Target } from "@/models";
import { S3Service } from "@/lib/s3";

// POST /api/targets/[id]/upload - Upload files to S3 and update target
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
      createdBy: userData.userId,
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

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Generate presigned URL for S3 upload
        const presignedUrl = await S3Service.generatePresignedUrl(
          file.fileName,
          file.fileType,
          userData.userId
        );

        // Extract the S3 key from the presigned URL
        const key = `targets/${userData.userId}/${Date.now()}-${file.fileName}`;
        const fileUrl = S3Service.getFileUrl(key);

        uploadedFiles.push({
          fileName: file.fileName,
          fileUrl,
          fileType: file.fileType,
          fileSize: file.fileSize,
          uploadedAt: new Date(),
        });
      } catch (error) {
        console.error("Error processing file:", file.fileName, error);
        // Continue with other files
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "No files were uploaded successfully" },
        { status: 400 }
      );
    }

    // Update target with new files
    const updatedTarget = await Target.findByIdAndUpdate(
      params.id,
      {
        $push: { files: { $each: uploadedFiles } },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Files uploaded successfully",
      target: updatedTarget,
      uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/targets/[id]/upload - Delete a file from target
export async function DELETE(
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
      createdBy: userData.userId,
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    // Extract S3 key from file URL
    const key = S3Service.getKeyFromUrl(fileUrl);
    if (!key) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Delete file from S3
    await S3Service.deleteFile(key);

    // Remove file from target document
    const updatedTarget = await Target.findByIdAndUpdate(
      params.id,
      {
        $pull: { files: { fileUrl } },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "File deleted successfully",
      target: updatedTarget,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
