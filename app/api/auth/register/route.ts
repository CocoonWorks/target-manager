import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const { username, password, name, phone } = await request.json();

    // Validate input
    if (!username || !password || !name || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      password,
      name,
      phone,
      active: true,
    });

    // Save user to database
    await newUser.save();

    // Return user data (excluding password)
    const userData = {
      id: newUser._id,
      username: newUser.username,
      name: newUser.name,
      phone: newUser.phone,
      active: newUser.active,
    };

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: userData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
