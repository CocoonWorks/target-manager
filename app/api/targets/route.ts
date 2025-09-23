import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Target, User } from "@/models";
import mongoose from "mongoose";

// GET /api/targets - Get all targets for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user ID from the auth token
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

    const targets = await Target.find({
      assignedTo: new mongoose.Types.ObjectId(userData.userId),
    })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name username");

    return NextResponse.json({ targets });
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/targets - Create a new target
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      assignedDate,
      description,
      tags,
      targetDate,
      documentCount,
      assignedTo,
      preview,
      source,
    } = body;

    // Validate required fields
    if (
      !title ||
      !assignedDate ||
      !description ||
      !targetDate ||
      !documentCount ||
      !assignedTo
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newTarget = new Target({
      title,
      assignedDate: new Date(assignedDate),
      description,
      tags: tags || [],
      targetDate: new Date(targetDate),
      documentCount: parseInt(documentCount),
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
      score: null,
      preview: preview || undefined,
      source: source || undefined,
      files: [],
    });

    await newTarget.save();

    return NextResponse.json(
      { message: "Target created successfully", target: newTarget },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
