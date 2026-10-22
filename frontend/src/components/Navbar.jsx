import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import api from "@/lib/api";
import { useFan } from "@/context/FanContext";

const LEFT_LINKS = [
  { to: "/", label: "Acasă", tid: "acasa" },
  { to: "/muzica", label: "Muzică", tid: "muzica" },
  { to: "/live", label: "Live", tid: "live" },
];
const RIGHT_LINKS = [
  { to: "/videoclipuri", label: "Videoclipuri", tid: "videoclipuri" },
  { to: "/despre", label: "Despre", tid: "despre" },
  { to: "/contact", label: "Contact", tid: "contact" },
];
const ALL_LINKS = [...LEFT_LINKS, ...RIGHT_LINKS];

function NavLink({ l, active, onClick }) {
  return (
    <Link
      to={l.to}
      onClick={onClick}
      data-testid={`nav-link-${l.tid}`}
      className={`text-xs uppercase tracking-[0.2em] transition-colors hover:text-[#39FF14] ${active ? "text-[#39FF14]" : "text-zinc-400"}`}
    >
      {l.label}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false);
  const location = useLocation();
  const { fan } = useFan();

  useEffect(() => {
    api.get("/live/status").then((r) => setLive(!!r.data.is_live)).catch(() => {});
    const t = setInterval(() => {
      api.get("/live/status").then((r) => setLive(!!r.data.is_live)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <nav data-testid="main-nav" className="fixed top-0 inset-x-0 z-50 bg-[#050805]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
        {/* STÂNGA — linkuri desktop / burger mobil */}
        <div className="hidden md:flex items-center gap-7">
          {LEFT_LINKS.map((l) => <NavLink key={l.to} l={l} active={location.pathname === l.to} />)}
        </div>
        <button data-testid="nav-menu-toggle" className="md:hidden text-[#39FF14] p-1" onClick={() => setOpen(!open)} aria-label="Meniu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* CENTRU — logo */}
        <Link to="/" data-testid="nav-logo" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <img src="/logo-alt.png" alt="BIOXIC" className="h-6 sm:h-7 hover:drop-shadow-[0_0_12px_rgba(57,255,20,0.9)] transition-all" />
          {live && (
            <span data-testid="nav-live-badge" className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#39FF14]">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] live-dot" /> Live
            </span>
          )}
        </Link>

        {/* DREAPTA — linkuri + cont */}
        <div className="flex items-center gap-7">
          <div className="hidden md:flex items-center gap-7">
            {RIGHT_LINKS.map((l) => <NavLink key={l.to} l={l} active={location.pathname === l.to} />)}
          </div>
          <Link to="/cont" data-testid="nav-link-cont"
            className={`flex items-center gap-2 text-xs uppercase tracking-[0.2em] transition-colors hover:text-[#39FF14] ${location.pathname === "/cont" ? "text-[#39FF14]" : "text-zinc-400"}`}>
            {fan && fan.picture ? (
              <img src={fan.picture} alt={fan.name} className="w-6 h-6 rounded-full border border-[#39FF14]" data-testid="nav-avatar" />
            ) : (
              <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${fan ? "border-[#39FF14] text-[#39FF14]" : "border-white/20"}`}>
                <User size={13} />
              </span>
            )}
            <span className="hidden sm:inline">{fan ? fan.name.split(" ")[0] : "Cont"}</span>
          </Link>
        </div>
      </div>

      {open && (
        <div data-testid="nav-mobile-menu" className="md:hidden bg-[#050805]/95 backdrop-blur-xl border-t border-white/10">
          {ALL_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-mobile-${l.tid}`}
              className={`block px-6 py-4 text-sm uppercase tracking-[0.2em] border-b border-white/5 ${location.pathname === l.to ? "text-[#39FF14]" : "text-zinc-300"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
