import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import api from "@/lib/api";

// Clopoțel de notificări — anunțuri și piese noi
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => localStorage.getItem("bioxic_notif_seen") || "");
  const ref = useRef(null);

  const load = () => api.get("/notifications").then((r) => setItems(r.data || [])).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const unread = items.filter((i) => i.created_at > seen).length;

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) {
      const now = new Date().toISOString();
      setSeen(now);
      localStorage.setItem("bioxic_notif_seen", now);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        data-testid="notif-bell"
        onClick={toggle}
        aria-label="Notificări"
        className="btn-ghost relative grid w-10 h-10 rounded-full place-items-center"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span data-testid="notif-badge" className="absolute -top-1 -right-1 grid min-w-[18px] h-[18px] px-1 rounded-full place-items-center text-[10px] font-black text-white" style={{ background: "var(--berry)" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 glass rounded-2xl w-72 max-h-80 overflow-y-auto chat-scroll p-2" data-testid="notif-dropdown">
          <p className="text-[10px] font-mono-x uppercase tracking-[0.25em] text-[var(--dim)] px-3 py-2">Notificări</p>
          {items.length === 0 && <p className="text-xs text-[var(--dim)] px-3 py-4">Nicio notificare încă.</p>}
          {items.map((n) => (
            <div key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors" data-testid={`notif-item-${n.id}`}>
              <p className="text-sm font-semibold leading-snug">{n.title}</p>
              {n.text && <p className="text-xs text-[var(--mist)] mt-0.5 leading-relaxed">{n.text}</p>}
              <p className="text-[10px] font-mono-x text-[var(--dim)] mt-1">
                {new Date(n.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
