// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

// MongoDB connection string - change this to your MongoDB instance
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager";

async function addDemoUser() {
  try {
    console.log("Connecting to MongoDB...");
    console.log(
      "Using URI:",
      MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    ); // Hide credentials

    // Connect to MongoDB with modern options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });

    console.log("✅ Connected to MongoDB successfully!");

    // Define User Schema
    const userSchema = new mongoose.Schema(
      {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        active: { type: Boolean, default: true },
      },
      { timestamps: true }
    );

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Demo user data
    const demoUser = {
      username: "demo",
      password: "demo123",
      name: "Demo User",
      phone: "+1234567890",
      active: true,
    };

    // Check if user already exists
    const existingUser = await User.findOne({ username: demoUser.username });
    if (existingUser) {
      console.log("ℹ️  Demo user already exists");
      return;
    }

    // Create new user
    const user = new User(demoUser);
    await user.save();

    console.log("✅ Demo user created successfully:", {
      username: user.username,
      name: user.name,
      phone: user.phone,
    });
  } catch (error) {
    if (error.name === "MongoServerSelectionError") {
      console.error("❌ MongoDB Connection Failed!");
      console.error(
        "Please make sure MongoDB is running or check your connection string."
      );
      console.error("\nOptions to fix this:");
      console.error(
        "1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
      );
      console.error(
        "2. Use MongoDB Atlas (free cloud): https://www.mongodb.com/atlas"
      );
      console.error(
        "3. Set MONGODB_URI environment variable with your connection string"
      );
    } else {
      console.error("❌ Error creating demo user:", error.message);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed");
    }
    process.exit(0);
  }
}

addDemoUser();
