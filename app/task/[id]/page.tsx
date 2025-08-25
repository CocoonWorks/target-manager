"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, X, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/hooks/useAuth";

interface Target {
  _id: string;
  title: string;
  assignedDate: string;
  description: string;
  tags: string[];
  status: "pending" | "completed";
  targetDate: string;
  priority: "low" | "medium" | "high";
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "document";
  name: string;
}

export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [target, setTarget] = useState<Target | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetId = params.id as string;

  // Fetch target data from API
  useEffect(() => {
    const fetchTarget = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("auth-token");

        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch(`/api/targets/${targetId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Target not found");
          } else {
            throw new Error("Failed to fetch target");
          }
          return;
        }

        const data = await response.json();
        setTarget(data.target);
      } catch (err) {
        console.error("Error fetching target:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch target");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && targetId) {
      fetchTarget();
    }
  }, [user, targetId]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading target...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !target) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {error === "Target not found"
                  ? "Target Not Found"
                  : "Error Loading Target"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {error ||
                  "The target you're looking for doesn't exist or you don't have permission to view it."}
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white rounded-xl"
              >
                Back to Targets
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      const fileType = file.type.startsWith("image/") ? "image" : "document";

      let preview = "";
      if (fileType === "image") {
        preview = URL.createObjectURL(file);
      }

      const newFile: UploadedFile = {
        id: fileId,
        file,
        preview,
        type: fileType,
        name: file.name,
      };

      setUploadedFiles((prev) => [...prev, newFile]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one file before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Prepare files for upload
      const filesToUpload = uploadedFiles.map((file) => ({
        fileName: file.name,
        fileType: file.file.type,
        fileSize: file.file.size,
        file: file.file,
      }));

      // Upload files to S3 via our API
      const response = await fetch(`/api/targets/${targetId}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: filesToUpload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload files");
      }

      const result = await response.json();
      console.log("Files uploaded successfully:", result);

      // Show success message and redirect
      alert("Target submitted successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error submitting target:", error);
      alert(
        `Error submitting target: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "completed"
      ? "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
      : "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <Header />

        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-purple-400/40 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/40 to-pink-400/40 rounded-full blur-3xl animate-float-medium"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-float-fast"></div>
        </div>

        <main className="relative container py-8 px-4 sm:px-6 lg:px-8 z-10">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-6 flex items-center space-x-2 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Targets</span>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Target Details - Glassmorphic */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                      {target.title}
                    </h1>
                    <div className="flex items-center space-x-4">
                      <span
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg",
                          getPriorityColor(target.priority)
                        )}
                      >
                        {target.priority.charAt(0).toUpperCase() +
                          target.priority.slice(1)}{" "}
                        Priority
                      </span>
                      <span
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg",
                          getStatusColor(target.status)
                        )}
                      >
                        {target.status.charAt(0).toUpperCase() +
                          target.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                      {target.description}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                        Assigned Date
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {formatDate(target.assignedDate)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                        Target Date
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {formatDate(target.targetDate)}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3 text-lg">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {target.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 text-sm font-medium bg-white/20 text-gray-800 dark:text-white rounded-lg border border-white/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Section - Glassmorphic */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Files
                </h3>

                {/* Existing Files */}
                {target.files && target.files.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">
                      Existing Files
                    </h4>
                    <div className="space-y-2">
                      {target.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm"
                        >
                          {file.fileType.startsWith("image/") ? (
                            <Image className="h-6 w-6 text-blue-600" />
                          ) : (
                            <FileText className="h-6 w-6 text-green-600" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-white/40 rounded-xl p-6 text-center mb-4 bg-white/10 backdrop-blur-sm">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-3 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white rounded-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Upload images, documents, or other files
                  </p>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      Uploaded Files
                    </h4>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-3 p-3 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm"
                      >
                        {file.type === "image" ? (
                          <Image className="h-8 w-8 text-blue-600" />
                        ) : (
                          <FileText className="h-8 w-8 text-green-600" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {file.type === "image" && file.preview && (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="h-12 w-12 object-cover rounded-lg"
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-red-600 hover:text-red-700 bg-white/20 hover:bg-white/30 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white rounded-lg backdrop-blur-sm"
                >
                  {isSubmitting ? "Submitting..." : "Submit Target"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
