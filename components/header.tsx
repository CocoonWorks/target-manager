"use client";

import { LogOut, Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side - App name */}
          <div className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">Target Manager</span>
          </div>

          {/* Center - User info */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Welcome, {user.name}</span>
            </div>
          )}

          {/* Right side - Theme toggle and logout */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutClick}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoading ? "Logging out..." : "Logout"}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to logout from Target Manager?
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelLogout}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
