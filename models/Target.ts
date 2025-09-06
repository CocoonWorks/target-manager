import mongoose from "mongoose";

export interface ITarget {
  title: string;
  assignedDate: Date;
  description: string;
  tags: string[];
  status: "pending" | "completed";
  targetDate: Date;
  documentCount: number;
  assignedTo: mongoose.Types.ObjectId;
  score: number | null;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
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
    documentCount: {
      type: Number,
      required: true,
      min: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      default: null,
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
  },
  { timestamps: true }
);

// Index for better query performance
targetSchema.index({ status: 1, targetDate: 1 });
targetSchema.index({ assignedTo: 1 });

const Target =
  mongoose.models.Target || mongoose.model<ITarget>("Target", targetSchema);
export default Target;
