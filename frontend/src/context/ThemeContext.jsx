import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const ThemeContext = createContext({ theme: "iarna" });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("iarna");

  useEffect(() => {
    api.get("/content").then((r) => {
      const t = r.data.theme === "ianuarie" ? "ianuarie" : "iarna";
      setTheme(t);
      document.documentElement.dataset.theme = t;
    }).catch(() => {
      document.documentElement.dataset.theme = "iarna";
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
