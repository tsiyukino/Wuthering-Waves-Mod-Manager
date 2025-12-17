import { useState, useEffect } from "react";

export default function ThemeToggle({ collapsed }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  }

  return (
    <div 
      className="nav-item" 
      onClick={toggleTheme}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span style={{ fontSize: 20 }}>{theme === "light" ? "🌙" : "☀️"}</span>
      {!collapsed && <span>Theme</span>}
    </div>
  );
}
