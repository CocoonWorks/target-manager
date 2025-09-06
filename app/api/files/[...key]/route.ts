import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    // Get token from either Authorization header or query parameter
    let token: string | null = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const url = new URL(request.url);
      token = url.searchParams.get("token");
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const keySegments = params.key || [];
    const fileKey = keySegments.join("/");

    // Generate a presigned URL for viewing the file
    const presignedUrl = await S3Service.generatePresignedUrl(
      fileKey,
      "getObject",
      3600
    ); // 1 hour expiry

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
