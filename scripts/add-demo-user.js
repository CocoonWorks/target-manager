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

    // Import models to ensure schemas are registered
    require("../models/User");
    require("../models/Target");

    // Get the User model
    const User = mongoose.model("User");

    // Check if demo user already exists
    const existingUser = await User.findOne({ username: "demo" });
    if (existingUser) {
      console.log("ℹ️  Demo user already exists");
      return;
    }

    // Create demo user
    const demoUser = new User({
      username: "demo",
      password: "demo123",
      name: "Demo User",
      phone: "+1234567890",
      active: true,
    });

    await demoUser.save();
    console.log("✅ Demo user created successfully!");
    console.log("📝 Username: demo");
    console.log("🔑 Password: demo123");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.name === "MongoServerSelectionError") {
      console.error(
        "💡 Make sure MongoDB is running and the connection string is correct"
      );
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
