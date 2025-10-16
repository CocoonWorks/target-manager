import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic"; // ensure this route is never statically optimized
export const revalidate = 0; // disable ISR for this route
export const runtime = "nodejs"; // explicit runtime
import connectDB from "@/lib/mongodb";
import { User } from "@/models";

// GET /api/auth/quick-login - Quick login with username and password in query params
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get username and password from query parameters
    const { searchParams } = request.nextUrl; // avoids static analysis issues with new URL(request.url)
    const username = searchParams.get("username");
    const password = searchParams.get("password");

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

    // Create user data for localStorage
    const userData = {
      id: user._id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      active: user.active,
    };

    // Create a page that sets localStorage and redirects
    const redirectPage = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Logging in...</title>
        </head>
        <body>
          <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
            <h2>Logging you in...</h2>
            <p>Please wait while we redirect you to the dashboard.</p>
          </div>
          <script>
            // Set localStorage data
            localStorage.setItem('user', '${JSON.stringify(userData).replace(
              /'/g,
              "\\'"
            )}');
            localStorage.setItem('auth-token', '${token}');
            
            // Redirect to dashboard
            window.location.href = '/';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(redirectPage, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Quick login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
