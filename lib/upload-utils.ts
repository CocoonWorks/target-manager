// Utility functions for direct file uploads to DigitalOcean Spaces

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  key: string;
}

export class UploadManager {
  private static async uploadFileToS3(
    file: File,
    presignedUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(
            new Error(
              `Upload failed with status: ${xhr.status}. Response: ${xhr.responseText}`
            )
          );
        }
      });

      xhr.addEventListener("error", (event) => {
        console.error("Upload error event:", event);
        reject(new Error("Upload failed due to network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was aborted"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timed out"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.timeout = 300000; // 5 minutes timeout

      // Add CORS handling
      xhr.withCredentials = false;

      xhr.send(file);
    });
  }

  static async uploadFiles(
    files: File[],
    targetId: string,
    token: string,
    onProgress?: (progress: UploadProgress[]) => void,
    onMethodChange?: (method: string) => void
  ): Promise<UploadedFile[]> {
    try {
      // Step 1: Get presigned URLs
      const presignedResponse = await fetch(
        `/api/targets/${targetId}/upload/presigned`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            files: files.map((file) => ({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            })),
          }),
        }
      );

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        console.error("Presigned URL request failed:", errorData);
        throw new Error(errorData.error || "Failed to get presigned URLs");
      }

      const { presignedUrls } = await presignedResponse.json();

      // Check if we should use fallback upload method
      const useFallback =
        localStorage.getItem("use-fallback-upload") === "true";
      if (useFallback) {
        if (onMethodChange) onMethodChange("Server Upload (Manual Fallback)");
        return await this.uploadFilesViaServer(
          files,
          targetId,
          token,
          onProgress
        );
      }

      // Step 2: Try direct upload first, fallback to server if CORS fails
      try {
        if (onMethodChange)
          onMethodChange("Direct Upload to DigitalOcean Spaces");
        const uploadPromises = presignedUrls.map(
          async (presignedData: any, index: number) => {
            const file = files[index];
            const progress: UploadProgress = {
              fileName: file.name,
              progress: 0,
              status: "pending",
            };

            try {
              progress.status = "uploading";
              if (onProgress)
                onProgress([
                  ...presignedUrls.map((_: any, i: number) =>
                    i === index
                      ? progress
                      : {
                          fileName: files[i].name,
                          progress: 0,
                          status: "pending",
                        }
                  ),
                ]);

              await this.uploadFileToS3(
                file,
                presignedData.presignedUrl,
                (uploadProgress) => {
                  progress.progress = uploadProgress;
                  if (onProgress)
                    onProgress([
                      ...presignedUrls.map((_: any, i: number) =>
                        i === index
                          ? progress
                          : {
                              fileName: files[i].name,
                              progress: 0,
                              status: "pending",
                            }
                      ),
                    ]);
                }
              );

              progress.status = "completed";
              progress.progress = 100;
              if (onProgress)
                onProgress([
                  ...presignedUrls.map((_: any, i: number) =>
                    i === index
                      ? progress
                      : {
                          fileName: files[i].name,
                          progress: 0,
                          status: "pending",
                        }
                  ),
                ]);

              return {
                fileName: presignedData.fileName,
                fileUrl: presignedData.fileUrl,
                fileType: presignedData.fileType,
                fileSize: presignedData.fileSize,
                key: presignedData.key,
              };
            } catch (error) {
              console.error(`Upload failed for file ${file.name}:`, error);
              progress.status = "error";
              progress.error =
                error instanceof Error ? error.message : "Upload failed";
              if (onProgress)
                onProgress([
                  ...presignedUrls.map((_: any, i: number) =>
                    i === index
                      ? progress
                      : {
                          fileName: files[i].name,
                          progress: 0,
                          status: "pending",
                        }
                  ),
                ]);
              throw error;
            }
          }
        );

        const uploadedFiles = await Promise.all(uploadPromises);

        // Step 3: Confirm uploads with the server
        const confirmResponse = await fetch(
          `/api/targets/${targetId}/upload/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              uploadedFiles,
            }),
          }
        );

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.error || "Failed to confirm uploads");
        }

        return uploadedFiles;
      } catch (error) {
        console.error("Direct upload failed, trying server upload:", error);
        // If direct upload fails (likely CORS), try server upload
        if (onMethodChange) onMethodChange("Server Upload (CORS Fallback)");
        return await this.uploadFilesViaServer(
          files,
          targetId,
          token,
          onProgress
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    // File size limit (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 50MB" };
    }

    // Allowed file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "File type not supported" };
    }

    return { valid: true };
  }

  // Fallback upload method via server
  private static async uploadFilesViaServer(
    files: File[],
    targetId: string,
    token: string,
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<UploadedFile[]> {
    // Build multipart form data
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.name);
    });
    formData.append(
      "meta",
      JSON.stringify({
        files: files.map((f) => ({
          fileName: f.name,
          fileType: f.type,
          fileSize: f.size,
        })),
      })
    );

    // Upload files to server
    const response = await fetch(`/api/targets/${targetId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload files via server");
    }

    const result = await response.json();
    return result.uploadedFiles || [];
  }
}
