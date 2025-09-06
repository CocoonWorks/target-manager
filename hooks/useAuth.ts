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
    // Check for user data in localStorage
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("auth-token");

    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("❌ useAuth: Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("auth-token");
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    // Clear local storage immediately
    localStorage.removeItem("user");
    localStorage.removeItem("auth-token");
    setUser(null);

    // Redirect to login
    router.push("/login");
  };

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}
