"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:text-primary"
    >
      <span className="relative flex h-6 w-11 items-center rounded-full bg-muted p-1 transition-colors">
        <span
          className={`absolute h-4 w-4 rounded-full bg-primary shadow-sm transition-transform ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
        <Sun className="relative z-10 h-3.5 w-3.5 text-accent" />
        <Moon className="relative z-10 ml-auto h-3.5 w-3.5 text-secondary" />
      </span>
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
