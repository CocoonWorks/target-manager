import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Login attempt started");

    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Parse request body
    const { username, password } = await request.json();
    console.log("📝 Login attempt for username:", username);

    // Validate input
    if (!username || !password) {
      console.log("❌ Missing username or password");
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
    console.log("🔍 User lookup result:", user ? "Found" : "Not found");

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      console.log("❌ Invalid credentials");
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    console.log("✅ Login successful for user:", user.username);

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

    console.log("🍪 Auth cookie set successfully");
    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
