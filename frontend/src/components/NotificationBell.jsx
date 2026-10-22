import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Radio, Megaphone, Music, Video, Gamepad2 } from "lucide-react";
import api from "@/lib/api";

const KIND_ICON = { live: Radio, gaming: Gamepad2, piesa: Music, video: Video, anunt: Megaphone };

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => localStorage.getItem("bioxic_notif_seen") || "");
  const ref = useRef(null);

  useEffect(() => {
    const load = () => api.get("/notifications").then((r) => setItems(r.data || [])).catch(() => {});
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const unread = items.filter((n) => !seen || n.created_at > seen).length;

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (!open && items.length) {
      const newest = items[0].created_at;
      localStorage.setItem("bioxic_notif_seen", newest);
      setSeen(newest);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button data-testid="notif-bell" onClick={toggleOpen} className="relative p-2 text-zinc-400 hover:text-[var(--accent)] transition-colors" aria-label="Notificări">
        <Bell size={17} />
        {unread > 0 && (
          <span data-testid="notif-badge" className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[var(--accent)] text-black text-[9px] font-black flex items-center justify-center rounded-full">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div data-testid="notif-panel" className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto bg-[var(--pine)] border border-[var(--accent)]/25 rounded-sm shadow-2xl z-[70]">
          <p className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500 border-b border-white/5">Notificări</p>
          {items.length === 0 && <p className="px-4 py-6 text-xs text-zinc-600 text-center">Nicio notificare încă. Afli primul când intrăm live sau apare ceva nou.</p>}
          {items.map((n) => {
            const Icon = KIND_ICON[n.kind] || Megaphone;
            return (
              <Link key={n.id} to={n.url || "/"} onClick={() => setOpen(false)} data-testid={`notif-${n.id}`}
                className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-[var(--accent)]/5 transition-colors">
                <Icon size={15} className="text-[var(--accent)] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{n.title}</p>
                  {n.text && <p className="text-[11px] text-zinc-500 line-clamp-2">{n.text}</p>}
                  <p className="text-[9px] text-zinc-600 mt-1">{new Date(n.created_at).toLocaleString("ro-RO")}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
