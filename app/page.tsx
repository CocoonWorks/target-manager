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
  status: "pending" | "submitted";
  targetDate: string;
  documentCount: number;
  assignedTo: {
    _id: string;
    name: string;
    username: string;
  };
  score: number | null;
  report?: "accepted" | "rejected" | "pending";
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

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch targets from API
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("auth-token");

        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch("/api/targets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error("Failed to fetch targets");
        }

        const data = await response.json();
        setTasks(data.targets);
      } catch (err) {
        console.error("❌ Home: Error fetching targets:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch targets"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTargets();
    }
  }, [user]);

  const getFilteredTasks = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    switch (activeFilter) {
      case "pending":
        return tasks.filter((task) => task.status === "pending");
      case "completed":
        return tasks.filter((task) => task.status === "submitted");
      case "today":
        return tasks.filter((task) => {
          const targetDate = new Date(task.targetDate);
          return targetDate.toDateString() === today.toDateString();
        });
      case "7days":
        return tasks.filter((task) => {
          const targetDate = new Date(task.targetDate);
          return targetDate <= sevenDaysFromNow && targetDate >= today;
        });
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tasks...</p>
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
                Error Loading Tasks
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
              {/* <Button
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
              </Button> */}
            </div>
          </div>

          {/* Target count - no glassmorphic effect */}
          <div className="text-center mb-8">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Showing {filteredTasks.length} task
              {filteredTasks.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Glassmorphic grid layout for all tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTasks.map((task) => (
              <TargetCard
                key={task._id}
                id={task._id}
                title={task.title}
                assignedDate={task.assignedDate}
                description={task.description}
                tags={task.tags}
                status={task.status}
                targetDate={task.targetDate}
                documentCount={task.documentCount}
                score={task.score}
                report={task.report}
              />
            ))}
          </div>

          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {activeFilter === "all"
                    ? "Create your first task to get started!"
                    : `No ${activeFilter} tasks found.`}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
