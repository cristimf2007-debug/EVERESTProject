import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import api from "@/lib/api";
import { useFan } from "@/context/FanContext";
import NotificationBell from "@/components/NotificationBell";
import Garland from "@/components/Garland";
import { useTheme } from "@/context/ThemeContext";

const TABS = [
  { to: "/muzica", label: "Piese", tid: "piese" },
  { to: "/live", label: "Live", tid: "live" },
  { to: "/gaming", label: "Gaming", tid: "gaming" },
  { to: "/videoclipuri", label: "Clipuri", tid: "videoclipuri" },
  { to: "/despre", label: "Despre", tid: "despre" },
  { to: "/contact", label: "Contact", tid: "contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false);
  const location = useLocation();
  const { fan } = useFan();
  const { theme } = useTheme();

  useEffect(() => {
    api.get("/live/status").then((r) => setLive(!!r.data.is_live)).catch(() => {});
    const t = setInterval(() => {
      api.get("/live/status").then((r) => setLive(!!r.data.is_live)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header data-testid="main-nav"
      className="sticky top-0 z-40 border-b border-[rgba(234,242,237,0.11)] backdrop-blur-md"
      style={{ background: "linear-gradient(180deg, rgba(6,17,13,.92), rgba(6,17,13,.72))" }}>
      <div className="max-w-[1120px] mx-auto px-4 h-16 flex items-center gap-3 relative">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo-alt.png" alt="BIOXIC" className="h-7 hover:drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] transition-all" />
          {live && (
            <span data-testid="nav-live-badge" className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[var(--berry)]">
              <span className="w-2 h-2 rounded-full bg-[var(--berry)] live-dot" /> Live
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Meniu">
          {TABS.map((t) => {
            const active = location.pathname === t.to;
            return (
              <Link key={t.to} to={t.to} data-testid={`nav-link-${t.tid}`}
                className={`px-3.5 py-2 rounded-full font-display text-[11px] font-semibold tracking-[0.12em] uppercase transition-all ${
                  active ? "bg-[var(--accent)] text-[var(--night)] shadow-[0_0_22px_rgba(var(--accent-rgb),0.45)]" : "text-[var(--mist)] hover:text-[var(--frost)] hover:bg-white/5"}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto md:ml-2">
          <NotificationBell />
          <Link to="/cont" data-testid="nav-link-cont" aria-label="Contul meu"
            className="w-10 h-10 rounded-full border border-[rgba(234,242,237,0.22)] grid place-items-center overflow-hidden transition-colors hover:border-[var(--accent)]"
            style={{ background: "var(--glass-hi)" }}>
            {fan && fan.picture ? (
              <img src={fan.picture.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${fan.picture}` : fan.picture} alt={fan.name} className="w-full h-full object-cover" data-testid="nav-avatar" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fan ? "var(--accent)" : "var(--frost)"} strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>
            )}
          </Link>
          <button data-testid="nav-menu-toggle" className="md:hidden text-[var(--accent)] p-1" onClick={() => setOpen(!open)} aria-label="Meniu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div data-testid="nav-mobile-menu" className="md:hidden border-t border-white/5 backdrop-blur-xl" style={{ background: "rgba(6,17,13,.95)" }}>
          {TABS.map((t) => (
            <Link key={t.to} to={t.to} data-testid={`nav-mobile-${t.tid}`}
              className={`block px-6 py-4 font-display text-xs uppercase tracking-[0.15em] border-b border-white/5 ${location.pathname === t.to ? "text-[var(--accent)]" : "text-[var(--mist)]"}`}>
              {t.label}
            </Link>
          ))}
        </div>
      )}
      {theme === "iarna" && <Garland />}
    </header>
  );
}
