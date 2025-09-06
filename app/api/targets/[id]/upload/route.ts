import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Target } from "@/models";
import { S3Service } from "@/lib/s3";
import mongoose from "mongoose";

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
      assignedTo: new mongoose.Types.ObjectId(userData.userId),
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // Support both JSON with metadata or multipart/form-data with files
    let files: any[] = [];
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const jsonMeta = formData.get("meta");
      const parsedMeta = jsonMeta ? JSON.parse(String(jsonMeta)) : {};
      const blobs = formData.getAll("files");
      files = blobs.map((blob: any, index: number) => ({
        fileName: parsedMeta.files?.[index]?.fileName || (blob as File).name,
        fileType: parsedMeta.files?.[index]?.fileType || (blob as File).type,
        fileSize: parsedMeta.files?.[index]?.fileSize || (blob as File).size,
        file: blob as File,
      }));
    } else {
      const body = await request.json();
      files = body.files;
    }

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Files array is required" },
        { status: 400 }
      );
    }

    const uploadedFiles = [] as any[];

    for (const file of files) {
      try {
        // For server-side upload, write directly to Spaces
        const key = `targets/${userData.userId}/${Date.now()}-${file.fileName}`;
        const arrayBuffer = await (file.file as File).arrayBuffer();
        await S3Service.uploadBuffer(
          key,
          new Uint8Array(arrayBuffer),
          file.fileType,
          { uploadedBy: String(userData.userId), originalName: file.fileName }
        );

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

    // Check if all required files are now uploaded and update status to completed
    if (
      updatedTarget &&
      updatedTarget.files.length >= updatedTarget.documentCount
    ) {
      await Target.findByIdAndUpdate(
        params.id,
        { status: "completed" },
        { new: true }
      );
    }

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
      assignedTo: new mongoose.Types.ObjectId(userData.userId),
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
