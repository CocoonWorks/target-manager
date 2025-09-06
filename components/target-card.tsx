"use client";

import {
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TargetCardProps {
  id: string;
  title: string;
  assignedDate: string;
  description: string;
  tags: string[];
  status: "completed" | "pending";
  targetDate: string;
  documentCount: number;
  score: number | null;
}

export function TargetCard({
  id,
  title,
  assignedDate,
  description,
  tags,
  status,
  targetDate,
  documentCount,
  score,
}: TargetCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/task/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/30"
    >
      {/* First row - Two dates with flex justify-between */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(assignedDate)}</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          <span>{formatDate(targetDate)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-base leading-tight mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs font-medium bg-white/20 text-foreground rounded-full border border-white/30"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Document Count and Score */}
      <div className="flex justify-between items-center mb-3 text-xs text-muted-foreground">
        <span>Documents: {documentCount}</span>
        {score !== null && <span>Score: {score}</span>}
      </div>

      {/* Status and arrow */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full",
            status === "completed"
              ? "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
              : "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30"
          )}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}
