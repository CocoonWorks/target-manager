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
      // Check if we should use fallback upload method first
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

      // Step 1: Get presigned URLs (preferred method for Vercel)
      if (onMethodChange) onMethodChange("Direct Upload (Presigned URLs)");

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
        // If presigned URLs fail, try to get error details
        let errorMessage = "Failed to get presigned URLs";
        try {
          const errorData = await presignedResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON (HTML error page), provide helpful message
          errorMessage = `Server error (${presignedResponse.status}). This might be due to Vercel deployment limits. Try enabling fallback upload.`;
        }
        console.error("Presigned URL request failed:", errorMessage);
        throw new Error(errorMessage);
      }

      const { presignedUrls } = await presignedResponse.json();

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

        // Clear any error progress from the failed direct upload
        if (onProgress) {
          onProgress([]);
        }

        try {
          return await this.uploadFilesViaServer(
            files,
            targetId,
            token,
            onProgress
          );
        } catch (serverError) {
          // Only throw the original error if server upload also fails
          console.error("Both upload methods failed:", {
            directError: error,
            serverError,
          });
          throw error; // Throw the original error, not the server error
        }
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
    // Check total file size to warn about Vercel limits
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 50 * 1024 * 1024; // 50MB Vercel Pro limit

    if (totalSize > maxSize) {
      throw new Error(
        `Total file size (${(totalSize / 1024 / 1024).toFixed(
          2
        )}MB) exceeds Vercel limit (50MB). Please upload files individually or reduce file sizes.`
      );
    }

    // Show initial progress for server upload
    if (onProgress) {
      onProgress(
        files.map((file) => ({
          fileName: file.name,
          progress: 0,
          status: "pending" as const,
        }))
      );
    }

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

    // Show uploading progress
    if (onProgress) {
      onProgress(
        files.map((file) => ({
          fileName: file.name,
          progress: 50,
          status: "uploading" as const,
        }))
      );
    }

    // Upload files to server
    const response = await fetch(`/api/targets/${targetId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Failed to upload files via server";

      try {
        // Try to parse JSON error response
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON (HTML error page from Vercel)
        if (response.status === 413) {
          errorMessage =
            "File too large for server upload. Try reducing file size or using direct upload.";
        } else if (response.status >= 500) {
          errorMessage = `Server error (${response.status}). This might be due to Vercel function timeout or memory limits.`;
        } else {
          errorMessage = `Upload failed (${response.status}). Response is not in JSON format - this usually indicates a Vercel deployment issue.`;
        }
      }

      throw new Error(errorMessage);
    }

    // Show completed progress
    if (onProgress) {
      onProgress(
        files.map((file) => ({
          fileName: file.name,
          progress: 100,
          status: "completed" as const,
        }))
      );
    }

    const result = await response.json();
    return result.uploadedFiles || [];
  }
}
