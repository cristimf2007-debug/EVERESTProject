import React, { useEffect } from "react";

// Protecție disuasivă: fără click-dreapta, fără F12/Ctrl+U/Ctrl+S, fără drag pe imagini.
// Notă: niciun site nu poate bloca complet DevTools — asta oprește copierea casuală;
// protecția reală a pieselor e pe server (link-uri audio semnate care expiră).
export default function Protection() {
  useEffect(() => {
    const noContext = (e) => e.preventDefault();
    const noKeys = (e) => {
      const k = e.key.toLowerCase();
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k"].includes(k)) ||
        (e.ctrlKey && ["u", "s", "p"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const noDrag = (e) => {
      if (e.target.tagName === "IMG") e.preventDefault();
    };
    document.addEventListener("contextmenu", noContext);
    document.addEventListener("keydown", noKeys, true);
    document.addEventListener("dragstart", noDrag);
    return () => {
      document.removeEventListener("contextmenu", noContext);
      document.removeEventListener("keydown", noKeys, true);
      document.removeEventListener("dragstart", noDrag);
    };
  }, []);
  return null;
}
