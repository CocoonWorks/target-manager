import mongoose from "mongoose";

export interface IUser {
  username: string;
  password: string;
  name: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true, // This creates the index automatically
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove the duplicate index definition
// userSchema.index({ username: 1 });

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
