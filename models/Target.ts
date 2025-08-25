import mongoose from "mongoose";

export interface ITarget {
  title: string;
  assignedDate: Date;
  description: string;
  tags: string[];
  status: "pending" | "completed";
  targetDate: Date;
  priority: "low" | "medium" | "high";
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const targetSchema = new mongoose.Schema<ITarget>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    assignedDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    targetDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    files: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for better query performance
targetSchema.index({ status: 1, priority: 1, targetDate: 1 });
targetSchema.index({ createdBy: 1 });

const Target =
  mongoose.models.Target || mongoose.model<ITarget>("Target", targetSchema);
export default Target;
