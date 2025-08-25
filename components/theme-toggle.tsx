"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center space-x-2"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
