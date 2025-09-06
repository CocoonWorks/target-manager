import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/models";

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await User.findOne({
      username: username.toLowerCase(),
      active: true,
    });

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create a token with user data in JSON format
    const tokenData = {
      userId: user._id.toString(),
      username: user.username,
      timestamp: Date.now(),
    };
    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64");

    // Return user data and set cookie
    const userData = {
      id: user._id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      active: user.active,
    };

    const response = NextResponse.json({
      message: "Login successful",
      user: userData,
      token: token,
    });

    // Set authentication cookie with proper options
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
