"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  Image,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/hooks/useAuth";
// Simplified upload: no UploadManager
import { useToast, ToastContainer } from "@/components/ui/toast";
import { DocumentViewer } from "@/components/document-viewer";

interface Target {
  _id: string;
  title: string;
  assignedDate: string;
  description: string;
  tags: string[];
  status: "pending" | "completed";
  targetDate: string;
  documentCount: number;
  assignedTo: {
    _id: string;
    name: string;
    username: string;
  };
  score: number | null;
  preview?: string;
  source?: string;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const [target, setTarget] = useState<Target | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [deletingFileIndex, setDeletingFileIndex] = useState<number | null>(
    null
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    fileIndex: number;
    fileName: string;
    fileUrl: string;
  } | null>(null);
  const { toasts, addToast, removeToast } = useToast();

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
                Back to Tasks
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

    // Accept multiple images/documents; basic type check for image priority
    const nextFiles: UploadedFile[] = [];
    Array.from(files).forEach((f) => {
      const id = Math.random().toString(36).substr(2, 9);
      const type: "image" | "document" = f.type.startsWith("image/")
        ? "image"
        : "document";
      const preview = type === "image" ? URL.createObjectURL(f) : "";
      nextFiles.push({ id, file: f, preview, type, name: f.name });
    });

    // Clear previous errors
    setUploadError(null);
    setUploadedFiles((prev) => [...prev, ...nextFiles]);

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

  const confirmDeleteFile = (
    fileIndex: number,
    fileName: string,
    fileUrl: string
  ) => {
    setConfirmDelete({
      isOpen: true,
      fileIndex,
      fileName,
      fileUrl,
    });
  };

  const deleteExistingFile = async () => {
    if (!confirmDelete || !target) return;

    const { fileIndex, fileUrl } = confirmDelete;
    setDeletingFileIndex(fileIndex);
    setConfirmDelete(null);

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        addToast({
          type: "error",
          title: "Authentication Error",
          message: "No authentication token found",
        });
        return;
      }

      const response = await fetch(`/api/targets/${targetId}/upload`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete file");
      }

      addToast({
        type: "success",
        title: "File Deleted",
        message: "File has been successfully deleted.",
      });

      // Update local state to reflect deletion without full reload
      setTarget((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          files: prev.files.filter((f, i) => i !== fileIndex),
        } as Target;
        return next;
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      addToast({
        type: "error",
        title: "Delete Failed",
        message:
          error instanceof Error ? error.message : "Failed to delete file",
      });
    } finally {
      setDeletingFileIndex(null);
    }
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      addToast({
        type: "warning",
        title: "No files selected",
        message: "Please upload at least one file before submitting.",
      });
      return;
    }

    if (!target) {
      addToast({
        type: "error",
        title: "Error",
        message: "Target information not loaded",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Multi-file multipart POST to server endpoint (manual server upload)
      const form = new FormData();
      uploadedFiles.forEach((f) => form.append("files", f.file));

      const response = await fetch(`/api/targets/${targetId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      // Update page state without full reload
      setTarget(data.target);
      // Revoke previews and clear selection
      uploadedFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setUploadedFiles([]);

      addToast({
        type: "success",
        title: "Files Uploaded",
        message: "Your files have been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error submitting target:", error);
      setUploadError(error instanceof Error ? error.message : "Unknown error");
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

        <main className="relative container py-4 sm:py-6 lg:py-8 px-2 sm:px-6 lg:px-8 z-10">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-3 sm:mb-6 flex items-center space-x-2 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tasks</span>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Target Details - Glassmorphic */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                    {target.title}
                  </h1>
                  {/* {target.score !== null && (
                    <div className="flex items-center space-x-4 flex-wrap gap-2 mb-4">
                      <span className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        Score: {target.score}
                      </span>
                    </div>
                  )} */}

                  {/* Mobile Accordion Toggle */}
                  <button
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="lg:hidden flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 transition-colors mb-4"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {isDetailsExpanded ? "Hide Details" : "Show Details"}
                    </span>
                    {isDetailsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-800 dark:text-white" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-800 dark:text-white" />
                    )}
                  </button>
                </div>
                {/* Mobile: Show minimal info when collapsed */}
                <div className="lg:hidden">
                  {!isDetailsExpanded && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <h4 className="font-medium text-gray-800 dark:text-white mb-1 text-sm">
                            Assigned
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 text-xs">
                            {formatDate(target.assignedDate)}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <h4 className="font-medium text-gray-800 dark:text-white mb-1 text-sm">
                            Due Date
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 text-xs">
                            {formatDate(target.targetDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Detailed content - hidden on mobile when collapsed */}
                <div
                  className={cn(
                    "space-y-6",
                    "lg:block",
                    isDetailsExpanded ? "block" : "hidden"
                  )}
                >
                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-normal text-sm sm:text-base">
                      {target.description}
                    </p>
                  </div>

                  {/* Preview and Source */}
                  {(target.preview || target.source) && (
                    <div className="space-y-4">
                      {target.preview && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                            Preview
                          </h3>
                          <div className="relative rounded-xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm">
                            <img
                              src={target.preview}
                              alt="Task preview"
                              className="w-full h-auto max-h-96 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="p-8 text-center text-gray-600 dark:text-gray-300">
                                      <Image class="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                      <p>Preview image could not be loaded</p>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {target.source && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                            Helpful Link
                          </h3>
                          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                            <a
                              href={target.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline break-all"
                            >
                              {target.source}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-1 text-sm">
                        Assigned Date
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {formatDate(target.assignedDate)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-1 text-sm">
                        Target Date
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {formatDate(target.targetDate)}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3 text-lg">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {target.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 text-sm font-medium bg-white/10 text-gray-800 dark:text-white rounded-lg border border-white/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>{" "}
                {/* End of collapsible detailed content */}
              </div>
            </div>

            {/* File Upload Section - Glassmorphic */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Files
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {target.files.length}/{target.documentCount} uploaded
                  </div>
                </div>

                {/* Simplified: no strict document count gating */}

                {/* Upload Error Display */}
                {uploadError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Upload Error:</strong> {uploadError}
                    </p>
                  </div>
                )}

                {/* Simplified: no method/progress UI */}

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
                          className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors"
                        >
                          <div
                            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedFile(file);
                              setIsViewerOpen(true);
                            }}
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

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteFile(
                                index,
                                file.fileName,
                                file.fileUrl
                              );
                            }}
                            disabled={deletingFileIndex === index}
                            className="text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded-lg p-2"
                          >
                            {deletingFileIndex === index ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center mb-4 bg-white/5 backdrop-blur-sm">
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
                        className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm"
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
                  disabled={
                    isSubmitting ||
                    target.files.length + uploadedFiles.length !==
                      target.documentCount
                  }
                  className={cn(
                    "w-full mt-6 rounded-lg backdrop-blur-sm",
                    target.files.length + uploadedFiles.length ===
                      target.documentCount
                      ? "bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-700 dark:text-green-300"
                      : "bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white"
                  )}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : target.files.length + uploadedFiles.length ===
                      target.documentCount
                    ? `🎉 Complete Target (${target.documentCount} documents)`
                    : `Upload ${
                        target.documentCount -
                        (target.files.length + uploadedFiles.length)
                      } more document${
                        target.documentCount -
                          (target.files.length + uploadedFiles.length) !==
                        1
                          ? "s"
                          : ""
                      }`}
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} />

        {/* Document Viewer */}
        {selectedFile && (
          <DocumentViewer
            file={selectedFile}
            isOpen={isViewerOpen}
            onClose={() => {
              setIsViewerOpen(false);
              setSelectedFile(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/20">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete File
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete{" "}
                  <strong>"{confirmDelete.fileName}"</strong>? This action
                  cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={deleteExistingFile}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
