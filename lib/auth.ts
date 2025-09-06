interface UserData {
  userId: string;
  username: string;
  timestamp: number;
}

export function verifyToken(token: string): UserData | null {
  try {
    // Decode base64 token to get user data
    const decodedToken = Buffer.from(token, "base64").toString("utf-8");
    const userData = JSON.parse(decodedToken);

    // Validate that required fields exist
    if (!userData.userId || !userData.username) {
      return null;
    }

    return userData as UserData;
  } catch (error) {
    console.error("🔍 Auth: Error verifying token:", error);
    return null;
  }
}

export function createToken(userData: {
  userId: string;
  username: string;
  timestamp?: number;
}): string {
  try {
    const tokenData = {
      userId: userData.userId,
      username: userData.username,
      timestamp: userData.timestamp || Date.now(),
    };
    return Buffer.from(JSON.stringify(tokenData)).toString("base64");
  } catch (error) {
    console.error("Error creating token:", error);
    throw new Error("Failed to create token");
  }
}
