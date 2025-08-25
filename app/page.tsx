"use client";

import Header from "@/components/header";
import { TargetCard } from "@/components/target-card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch targets from API
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        console.log("🔍 Home: Starting to fetch targets...");
        setIsLoading(true);
        const token = localStorage.getItem("auth-token");

        console.log("🔍 Home: Token from localStorage:", token);

        if (!token) {
          console.log("❌ Home: No authentication token found");
          setError("No authentication token found");
          return;
        }

        console.log("🔍 Home: Making API call to /api/targets...");
        const response = await fetch("/api/targets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("🔍 Home: API response status:", response.status);
        console.log("🔍 Home: API response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("❌ Home: API error response:", errorText);
          throw new Error("Failed to fetch targets");
        }

        const data = await response.json();
        console.log("✅ Home: API response data:", data);
        setTargets(data.targets);
      } catch (err) {
        console.error("❌ Home: Error fetching targets:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch targets"
        );
      } finally {
        setIsLoading(false);
        console.log("🔍 Home: Fetch targets complete, isLoading:", false);
      }
    };

    console.log("🔍 Home: useEffect triggered, user:", user);
    if (user) {
      console.log("🔍 Home: User is authenticated, fetching targets...");
      fetchTargets();
    } else {
      console.log("🔍 Home: No user, not fetching targets");
    }
  }, [user]);

  const getFilteredTargets = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    switch (activeFilter) {
      case "pending":
        return targets.filter((target) => target.status === "pending");
      case "completed":
        return targets.filter((target) => target.status === "completed");
      case "today":
        return targets.filter((target) => {
          const targetDate = new Date(target.targetDate);
          return targetDate.toDateString() === today.toDateString();
        });
      case "7days":
        return targets.filter((target) => {
          const targetDate = new Date(target.targetDate);
          return targetDate <= sevenDaysFromNow && targetDate >= today;
        });
      default:
        return targets;
    }
  };

  const filteredTargets = getFilteredTargets();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading targets...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Error Loading Targets
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 dark:text-white rounded-xl"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
          {/* Filter section - no glassmorphic effect */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="rounded-full px-6"
              >
                All
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("pending")}
                className="rounded-full px-6"
              >
                Pending
              </Button>
              <Button
                variant={activeFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("completed")}
                className="rounded-full px-6"
              >
                Completed
              </Button>
              <Button
                variant={activeFilter === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("today")}
                className="rounded-full px-6"
              >
                Today
              </Button>
              <Button
                variant={activeFilter === "7days" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("7days")}
                className="rounded-full px-6"
              >
                7 Days
              </Button>
            </div>
          </div>

          {/* Target count - no glassmorphic effect */}
          <div className="text-center mb-8">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Showing {filteredTargets.length} target
              {filteredTargets.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Glassmorphic grid layout for all targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTargets.map((target) => (
              <TargetCard
                key={target._id}
                id={target._id}
                title={target.title}
                assignedDate={target.assignedDate}
                description={target.description}
                tags={target.tags}
                status={target.status}
                targetDate={target.targetDate}
                priority={target.priority}
              />
            ))}
          </div>

          {/* Empty state */}
          {filteredTargets.length === 0 && (
            <div className="text-center py-12">
              <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  No targets found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {activeFilter === "all"
                    ? "Create your first target to get started!"
                    : `No ${activeFilter} targets found.`}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
