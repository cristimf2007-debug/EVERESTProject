import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Radio, Disc3, Info, BadgeCheck, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import api, { getSid } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import Equalizer from "@/components/Equalizer";
import LogoModal from "@/components/LogoModal";

const TABS = [
  { to: "/", label: "Live 24/7", tid: "live", icon: Radio },
  { to: "/piese", label: "Piese", tid: "piese", icon: Disc3 },
  { to: "/pareri", label: "Păreri", tid: "pareri", icon: MessageSquareQuote },
  { to: "/despre", label: "Despre", tid: "despre", icon: Info },
];

export default function ChannelHeader() {
  const location = useLocation();
  const { playing, mode } = useRadio();
  const [subs, setSubs] = useState(0);
  const [subscribed, setSubscribed] = useState(() => localStorage.getItem("bioxic_sub") === "1");
  const [showBio, setShowBio] = useState(false);

  useEffect(() => {
    api.get("/channel/stats").then((r) => setSubs(r.data.subscribers)).catch(() => {});
  }, []);

  const toggleSub = async () => {
    const nextVal = !subscribed;
    setSubscribed(nextVal);
    localStorage.setItem("bioxic_sub", nextVal ? "1" : "0");
    try {
      const r = await api.post("/channel/subscribe", { sid: getSid(), subscribed: nextVal });
      setSubs(r.data.subscribers);
      if (nextVal) toast.success("Ești abonat la BIOXIC!", { description: "No risks, no hits." });
      else toast.info("Ai dezabonat canalul.");
    } catch {
      toast.error("Ceva nu a mers. Încearcă din nou.");
    }
  };

  return (
    <header data-testid="channel-header" className="relative z-10">
      {/* banner — poza reală a artistului */}
      <div className="relative h-44 sm:h-60 overflow-hidden">
        <img src="/artist.jpg" alt="BIOXIC" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,17,13,.15) 0%, rgba(6,17,13,.55) 55%, var(--night) 100%)" }} />
        <button
          onClick={() => setShowBio(true)}
          data-testid="channel-logo"
          aria-label="Cine sunt eu — deschide"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-110 hover:-rotate-2 cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="BIOXIC"
            className="w-44 sm:w-64 drop-shadow-[0_10px_36px_rgba(0,0,0,0.75)]"
          />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-2 text-[9px] font-mono-x uppercase tracking-[0.3em] text-[var(--frost)]/60 animate-pulse pointer-events-none">
          atinge logo-ul
        </span>
      </div>

      {/* profil */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex items-end gap-4 -mt-9 sm:-mt-12 relative z-10">
          <img
            src="/artist.jpg"
            alt="BIOXIC"
            data-testid="channel-avatar"
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[var(--accent)] shrink-0"
            style={{ boxShadow: "0 0 34px rgba(var(--accent-rgb),.4)", background: "var(--night)" }}
          />
          <div className="min-w-0 pb-1 flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide flex items-center gap-2 leading-none">
              BIOXIC <BadgeCheck size={19} className="text-[var(--accent)] shrink-0" />
            </h1>
            <p className="text-[11px] sm:text-xs text-[var(--mist)] font-mono-x mt-1.5 uppercase tracking-widest">
              <span data-testid="channel-subs-count" className="text-[var(--frost)]">{subs}</span> abonați · No risks, no hits.
            </p>
          </div>
          <div className="pb-1 flex items-center gap-3 shrink-0">
            {playing && mode === "live" && <Equalizer playing className="hidden sm:flex" />}
            <button
              data-testid="channel-subscribe-button"
              onClick={toggleSub}
              className={subscribed ? "btn-x !py-2.5 text-xs font-bold uppercase tracking-widest" : "btn-x gold !py-2.5 text-xs font-bold uppercase tracking-widest"}
            >
              {subscribed ? "Abonat" : "Abonează-te"}
            </button>
          </div>
        </div>

        {/* taburi */}
        <nav className="flex items-center gap-1 mt-6 border-b border-[var(--line)] overflow-x-auto" aria-label="Canal">
          {TABS.map((t) => {
            const active = location.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                data-testid={`tab-${t.tid}`}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  active ? "border-[var(--accent)] text-[var(--frost)]" : "border-transparent text-[var(--dim)] hover:text-[var(--frost)]"
                }`}
              >
                <Icon size={14} />
                {t.label}
                {t.tid === "live" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--berry)] live-dot" />}
              </Link>
            );
          })}
          <Link
            to="/admin"
            data-testid="tab-admin"
            className="ml-auto px-3 py-3 text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)] hover:text-[var(--frost)] transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>

      {showBio && <LogoModal onClose={() => setShowBio(false)} />}
    </header>
  );
}
