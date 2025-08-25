require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager";

async function addSampleTargets() {
  try {
    console.log("Connecting to MongoDB...");
    console.log(
      "Using URI:",
      MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    );

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB successfully!");

    // Import models to ensure schemas are registered
    require("../models/User");
    require("../models/Target");

    // Get the models
    const Target = mongoose.model("Target");
    const User = mongoose.model("User");

    // Get the demo user ID
    const demoUser = await User.findOne({ username: "demo" });
    if (!demoUser) {
      console.log("❌ Demo user not found. Please run add-demo-user.js first.");
      return;
    }

    console.log("✅ Found demo user:", demoUser.username);

    // Sample targets data
    const sampleTargets = [
      {
        title: "Website Redesign",
        assignedDate: new Date("2024-01-15"),
        description:
          "Redesign the company website with modern UI/UX principles and responsive design. The new design should focus on improving user experience, increasing conversion rates, and maintaining brand consistency across all pages.",
        tags: ["Design", "Frontend", "UI/UX"],
        status: "pending",
        targetDate: new Date("2024-02-15"),
        priority: "high",
        createdBy: demoUser._id,
        files: [],
      },
      {
        title: "Database Migration",
        assignedDate: new Date("2024-01-10"),
        description:
          "Migrate legacy database to new cloud infrastructure with zero downtime. This involves careful planning, testing, and execution to ensure data integrity and minimal service disruption.",
        tags: ["Backend", "Database", "DevOps"],
        status: "completed",
        targetDate: new Date("2024-01-25"),
        priority: "high",
        createdBy: demoUser._id,
        files: [],
      },
      {
        title: "API Documentation",
        assignedDate: new Date("2024-01-12"),
        description:
          "Create comprehensive API documentation for external developers. Include authentication methods, endpoint descriptions, request/response examples, and error handling guidelines.",
        tags: ["Documentation", "API", "Technical"],
        status: "pending",
        targetDate: new Date("2024-01-30"),
        priority: "medium",
        createdBy: demoUser._id,
        files: [],
      },
      {
        title: "Mobile App Testing",
        assignedDate: new Date("2024-01-08"),
        description:
          "Conduct thorough testing of mobile app across different devices and OS versions. Focus on functionality, performance, and user experience testing.",
        tags: ["Testing", "Mobile", "QA"],
        status: "pending",
        targetDate: new Date("2024-02-05"),
        priority: "medium",
        createdBy: demoUser._id,
        files: [],
      },
      {
        title: "Security Audit",
        assignedDate: new Date("2024-01-05"),
        description:
          "Perform comprehensive security audit of all systems and applications. Identify vulnerabilities, assess risks, and provide recommendations for security improvements.",
        tags: ["Security", "Audit", "Compliance"],
        status: "pending",
        targetDate: new Date("2024-02-10"),
        priority: "high",
        createdBy: demoUser._id,
        files: [],
      },
      {
        title: "Performance Optimization",
        assignedDate: new Date("2024-01-20"),
        description:
          "Optimize application performance and reduce loading times. Analyze current performance metrics and implement improvements for better user experience.",
        tags: ["Performance", "Optimization", "Frontend"],
        status: "pending",
        targetDate: new Date("2024-02-20"),
        priority: "low",
        createdBy: demoUser._id,
        files: [],
      },
    ];

    // Check if targets already exist
    const existingTargets = await Target.find({ createdBy: demoUser._id });
    if (existingTargets.length > 0) {
      console.log("ℹ️  Sample targets already exist for demo user");
      console.log("📊 Found targets:", existingTargets.length);
      return;
    }

    // Insert sample targets
    const insertedTargets = await Target.insertMany(sampleTargets);
    console.log("✅ Sample targets created successfully!");
    console.log("📊 Created targets:", insertedTargets.length);

    insertedTargets.forEach((target, index) => {
      console.log(`  ${index + 1}. ${target.title} (${target.status})`);
    });
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

addSampleTargets();
