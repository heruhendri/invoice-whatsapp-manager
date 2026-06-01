"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
      aria-label="Toggle theme"
    >
      {isDark ? <Moon size={16} /> : <Sun size={16} />}
      {isDark ? "Dark" : "Light"}
    </button>
  );
}

