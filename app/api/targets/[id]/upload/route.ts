import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
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

    // Accept multipart/form-data (manual server upload)
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    let blobs = formData.getAll("files");
    if (!blobs || blobs.length === 0) {
      const single = formData.get("file");
      if (single) blobs = [single];
    }

    const uploadedFiles: any[] = [];
    for (const entry of blobs) {
      // Treat entries as Blob-like objects (File may not exist in some Node runtimes)
      if (!entry || typeof (entry as any).arrayBuffer !== "function") continue;
      const fileName =
        ((entry as any).name as string) || `upload-${Date.now()}`;
      const fileType =
        ((entry as any).type as string) || "application/octet-stream";
      const fileSize = ((entry as any).size as number) || 0;

      const key = `targets/${userData.userId}/${Date.now()}-${fileName}`;
      const arrayBuffer = await (entry as any).arrayBuffer();
      await S3Service.uploadBuffer(key, new Uint8Array(arrayBuffer), fileType, {
        uploadedBy: String(userData.userId),
        originalName: fileName,
      });

      const fileUrl = S3Service.getFileUrl(key);
      uploadedFiles.push({
        fileName,
        fileUrl,
        fileType,
        fileSize,
        uploadedAt: new Date(),
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Update target with the new files
    const updatedTarget = await Target.findByIdAndUpdate(
      params.id,
      { $push: { files: { $each: uploadedFiles } } },
      { new: true }
    );

    // Optionally mark as completed
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
    console.error("Error uploading file:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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
