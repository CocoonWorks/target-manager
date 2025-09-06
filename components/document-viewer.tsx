"use client";

import { useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  file: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ file, isOpen, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const isImage = file.fileType.startsWith("image/");
  const isPdf = file.fileType === "application/pdf";

  const getAuthenticatedUrl = () => {
    // Extract the key from the file URL client-side (no env needed)
    const url = new URL(file.fileUrl);
    const key = url.pathname.replace(/^\//, "");
    return `/api/files/${encodeURIComponent(key)}`;
  };

  const getAuthenticatedUrlWithAuth = () => {
    const url = getAuthenticatedUrl();
    const token = localStorage.getItem("auth-token");
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = getAuthenticatedUrlWithAuth();
    link.download = file.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(getAuthenticatedUrlWithAuth(), "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] m-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {file.fileName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(file.fileSize)} • {file.fileType}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-2">
              <img
                src={getAuthenticatedUrlWithAuth()}
                alt={file.fileName}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ) : isPdf ? (
            <div className="w-full h-full">
              <iframe
                src={getAuthenticatedUrlWithAuth()}
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                    {file.fileName.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file.fileName}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  This file type cannot be previewed
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
