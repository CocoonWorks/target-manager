import mongoose from "mongoose";

export interface ITarget {
  title: string;
  assignedDate: Date;
  description: string;
  tags: string[];
  status: "pending" | "submitted";
  targetDate: Date;
  documentCount: number;
  assignedTo: mongoose.Types.ObjectId;
  score: number | null;
  preview?: string;
  source?: string;
  report?: "accepted" | "rejected" | "pending";
  report_description?: string;
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
    report: {
      type: String,
      enum: ["accepted", "rejected", "pending"],
      default: "pending",
    },
    report_description: {
      type: String,
      required: false,
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
      enum: ["pending", "submitted"],
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
    preview: {
      type: String,
      required: false,
    },
    source: {
      type: String,
      required: false,
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
