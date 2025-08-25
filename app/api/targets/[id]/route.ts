import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Target } from "@/models";

// GET /api/targets/[id] - Get a specific target
export async function GET(
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

    const target = await Target.findOne({
      _id: params.id,
      createdBy: userData.userId,
    }).populate("createdBy", "name username");

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ target });
  } catch (error) {
    console.error("Error fetching target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/targets/[id] - Update a target
export async function PUT(
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

    const body = await request.json();
    const {
      title,
      assignedDate,
      description,
      tags,
      targetDate,
      priority,
      status,
    } = body;

    const target = await Target.findOneAndUpdate(
      {
        _id: params.id,
        createdBy: userData.userId,
      },
      {
        title,
        assignedDate: assignedDate ? new Date(assignedDate) : undefined,
        description,
        tags,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        priority,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ target });
  } catch (error) {
    console.error("Error updating target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/targets/[id] - Delete a target
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

    const target = await Target.findOneAndDelete({
      _id: params.id,
      createdBy: userData.userId,
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Target deleted successfully" });
  } catch (error) {
    console.error("Error deleting target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
