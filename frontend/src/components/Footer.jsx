import React from "react";
import { Link } from "react-router-dom";
import { Accessibility } from "lucide-react";

const LINKS = [
  { to: "/", label: "Acasă", tid: "acasa" },
  { to: "/muzica", label: "Live", tid: "live" },
  { to: "/muzica/piese", label: "Piese", tid: "piese" },
  { to: "/muzica/playlisturi", label: "Playlisturi", tid: "playlisturi" },
  { to: "/clipuri", label: "Clipuri", tid: "clipuri" },
  { to: "/pareri", label: "Păreri", tid: "pareri" },
  { to: "/despre", label: "Despre", tid: "despre" },
  { to: "/despre", label: "Contact", tid: "contact" },
  { to: "/admin", label: "Admin", tid: "admin" },
];

// Footer: BIOXIC gigantic, gravat în obsidian, decupat jos
export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 sm:mt-32 overflow-hidden" data-testid="site-footer">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 pt-10 pb-6 border-t border-[var(--edge)]" aria-label="Footer">
          {LINKS.map((l) => (
            <Link
              key={l.tid}
              to={l.to}
              data-testid={`footer-link-${l.tid}`}
              className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-[var(--text-3)] hover:text-[var(--flame)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <button
            data-testid="footer-link-accesibilitate"
            onClick={() => window.dispatchEvent(new Event("bioxic:open-settings"))}
            className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-[var(--text-3)] hover:text-[var(--flame)] transition-colors flex items-center gap-1.5"
          >
            <Accessibility size={11} /> Accesibilitate
          </button>
        </nav>
        <p className="text-center font-mono-x text-[9px] uppercase tracking-[0.3em] text-[var(--text-3)] pb-4">
          © 2026 BIOXIC · No risks, no hits.
        </p>
      </div>
      <div className="footer-giant" aria-hidden="true">BIOXIC</div>
    </footer>
  );
}
