import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// DigitalOcean Spaces S3 Client configuration
const s3Client = new S3Client({
  region: process.env.DO_SPACES_REGION || "nyc3",
  endpoint: `https://${
    process.env.DO_SPACES_REGION || "nyc3"
  }.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false, // DigitalOcean Spaces requires virtual-hosted-style URLs
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET_NAME!;

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export class S3Service {
  // Generate presigned URL for direct upload
  static async generateUploadUrl(
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

  // Generate presigned URL for direct upload using a provided key
  static async generateUploadUrlForKey(
    key: string,
    fileType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    try {
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      }); // 1 hour
      return presignedUrl;
    } catch (error) {
      console.error("Error generating presigned URL for key:", error);
      throw new Error("Failed to generate upload URL for key");
    }
  }

  // Generate presigned URL for viewing/downloading files
  static async generatePresignedUrl(
    key: string,
    operation: "getObject" | "putObject" = "getObject",
    expiresIn: number = 3600
  ): Promise<string> {
    const command =
      operation === "getObject"
        ? new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          })
        : new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          });

    try {
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn,
      });
      return presignedUrl;
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error("Failed to generate file URL");
    }
  }

  // Get the public URL for a file
  static getFileUrl(key: string): string {
    // Use custom CDN URL if provided, otherwise use default DigitalOcean Spaces URL
    const cdnUrl = process.env.DO_SPACES_CDN_URL;
    if (cdnUrl) {
      return `${cdnUrl}/${key}`;
    }

    const region = process.env.DO_SPACES_REGION || "blr1";
    return `https://${BUCKET_NAME}.${region}.digitaloceanspaces.com/${key}`;
  }

  // Upload a buffer directly to Spaces
  static async uploadBuffer(
    key: string,
    buffer: Uint8Array,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error("Error uploading buffer to S3:", error);
      throw new Error("Failed to upload file to storage");
    }
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

  // Extract key from DigitalOcean Spaces URL
  static getKeyFromUrl(url: string): string {
    const bucketName = BUCKET_NAME;
    const region = process.env.DO_SPACES_REGION || "blr1";

    // Try CDN URL first
    const cdnUrl = process.env.DO_SPACES_CDN_URL;
    if (cdnUrl) {
      const cdnPattern = new RegExp(
        `${cdnUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(.+)`
      );
      const cdnMatch = url.match(cdnPattern);
      if (cdnMatch) return cdnMatch[1];
    }

    // Fallback to default DigitalOcean Spaces URL
    const pattern = new RegExp(
      `https://${bucketName}\\.${region}\\.digitaloceanspaces\\.com/(.+)`
    );
    const match = url.match(pattern);
    return match ? match[1] : "";
  }
}
