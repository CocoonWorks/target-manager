import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  username: string;
  name: string;
  phone: string;
  active: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("🔍 useAuth: Checking authentication...");

    // Check for user data in localStorage
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("auth-token");

    console.log("🔍 useAuth: userData from localStorage:", userData);
    console.log("🔍 useAuth: token from localStorage:", token);

    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log("🔍 useAuth: Parsed user data:", parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("❌ useAuth: Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("auth-token");
        setUser(null);
      }
    } else {
      console.log("🔍 useAuth: No user data or token found");
      setUser(null);
    }

    setIsLoading(false);
    console.log("🔍 useAuth: Authentication check complete, isLoading:", false);
  }, []);

  const logout = () => {
    console.log("🔄 Logging out...");

    // Clear local storage immediately
    localStorage.removeItem("user");
    localStorage.removeItem("auth-token");
    setUser(null);

    // Redirect to login
    router.push("/login");
  };

  const isAuthenticated = !!user;

  console.log(
    "🔍 useAuth: Current state - user:",
    user,
    "isLoading:",
    isLoading,
    "isAuthenticated:",
    isAuthenticated
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}
