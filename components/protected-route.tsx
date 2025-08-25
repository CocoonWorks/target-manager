"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  console.log(
    "🔍 ProtectedRoute: isAuthenticated:",
    isAuthenticated,
    "isLoading:",
    isLoading
  );

  useEffect(() => {
    console.log(
      "🔍 ProtectedRoute: useEffect triggered, isAuthenticated:",
      isAuthenticated,
      "isLoading:",
      isLoading
    );
    if (!isLoading && !isAuthenticated) {
      console.log("🔍 ProtectedRoute: Redirecting to login...");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log("🔍 ProtectedRoute: Showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    console.log("🔍 ProtectedRoute: Not authenticated, not rendering children");
    return null;
  }

  // If authenticated, render children
  console.log("🔍 ProtectedRoute: Authenticated, rendering children");
  return <>{children}</>;
}
