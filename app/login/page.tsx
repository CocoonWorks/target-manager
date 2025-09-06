"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Store token in localStorage for client-side access
      localStorage.setItem("auth-token", data.token);

      // Redirect to main page
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-purple-400/40 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/40 to-pink-400/40 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-float-fast"></div>
      </div>

      <main className="relative container px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex items-center justify-center min-h-screen">
          {/* Login Form */}
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-3 border border-white/25">
                  <Lock className="h-6 w-6 text-gray-900 dark:text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Welcome Back
                </h1>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Sign in to your Task Manager account
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-800 dark:text-red-200 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username Field */}
                <div className="space-y-1">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-white/15 border-white/25 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 rounded-lg backdrop-blur-sm focus:bg-white/25 focus:border-white/40"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/15 border-white/25 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-300 rounded-lg backdrop-blur-sm focus:bg-white/25 focus:border-white/40"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Spacer for extra margin before button */}
                <div className="h-1"></div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white/15 hover:bg-white/25 border border-white/25 text-gray-900 dark:text-white rounded-lg backdrop-blur-sm py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-700 dark:border-gray-200 border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Demo Info */}
              {/* <div className="mt-4 p-3 rounded-lg bg-white/8 backdrop-blur-sm border border-white/15">
                <p className="text-xs text-gray-700 dark:text-gray-300 text-center">
                  Demo: Use username: <strong>demo</strong> and password:{" "}
                  <strong>demo123</strong>
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
