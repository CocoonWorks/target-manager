import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export class S3Service {
  // Generate presigned URL for direct upload
  static async generatePresignedUrl(
    fileName: string,
    fileType: string,
    userId: string
  ): Promise<string> {
    const key = `targets/${userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        uploadedBy: userId,
        originalName: fileName,
      },
    });

    try {
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      }); // 1 hour
      return presignedUrl;
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error("Failed to generate upload URL");
    }
  }

  // Get the public URL for a file
  static getFileUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${key}`;
  }

  // Delete a file from S3
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      throw new Error("Failed to delete file");
    }
  }

  // Extract key from S3 URL
  static getKeyFromUrl(url: string): string {
    const bucketName = BUCKET_NAME;
    const region = process.env.AWS_REGION || "us-east-1";
    const pattern = new RegExp(
      `https://${bucketName}\\.s3\\.${region}\\.amazonaws\\.com/(.+)`
    );
    const match = url.match(pattern);
    return match ? match[1] : "";
  }
}
