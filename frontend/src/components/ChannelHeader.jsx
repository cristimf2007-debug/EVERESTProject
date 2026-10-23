import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Radio, Disc3, Info, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import api, { getSid } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import Equalizer from "@/components/Equalizer";

const TABS = [
  { to: "/", label: "Live 24/7", tid: "live", icon: Radio },
  { to: "/piese", label: "Piese", tid: "piese", icon: Disc3 },
  { to: "/despre", label: "Despre", tid: "despre", icon: Info },
];

const BANNER = "https://images.pexels.com/photos/5610120/pexels-photo-5610120.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function ChannelHeader() {
  const location = useLocation();
  const { playing, mode } = useRadio();
  const [subs, setSubs] = useState(0);
  const [subscribed, setSubscribed] = useState(() => localStorage.getItem("bioxic_sub") === "1");

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
      if (nextVal) toast.success("Ești abonat la BIOXIC!", { description: "Primești noutățile direct din seif." });
      else toast.info("Ai dezabonat canalul.");
    } catch {
      toast.error("Ceva nu a mers. Încearcă din nou.");
    }
  };

  return (
    <header data-testid="channel-header" className="relative">
      {/* banner canal */}
      <div className="relative h-36 sm:h-48 overflow-hidden">
        <img src={BANNER} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,8,17,.25), rgba(5,8,17,.92))" }} />
      </div>

      {/* identitate canal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex items-end gap-4 -mt-10 sm:-mt-12 relative z-10">
          <img
            src="/logo-alt.png"
            alt="BIOXIC"
            data-testid="channel-avatar"
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[var(--cyan)] shrink-0"
            style={{ boxShadow: "0 0 34px rgba(0,240,255,.45)", background: "var(--bg)" }}
          />
          <div className="min-w-0 pb-1 flex-1">
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight flex items-center gap-2 leading-none">
              BIOXIC <BadgeCheck size={22} className="text-[var(--cyan)] shrink-0" />
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] font-mono-x mt-1">
              @BIOXIC · <span data-testid="channel-subs-count" className="text-white">{subs}</span> abonați · No risks, no hits.
            </p>
          </div>
          <div className="pb-1 flex items-center gap-3 shrink-0">
            {playing && mode === "live" && <Equalizer playing className="hidden sm:flex" />}
            <button
              data-testid="channel-subscribe-button"
              onClick={toggleSub}
              className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide ${subscribed ? "btn-ghost" : "btn-cyan"}`}
            >
              {subscribed ? "Abonat" : "Abonează-te"}
            </button>
          </div>
        </div>

        {/* taburi canal */}
        <nav className="flex items-center gap-1 mt-6 border-b border-[var(--border)] overflow-x-auto" aria-label="Canal">
          {TABS.map((t) => {
            const active = location.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                data-testid={`tab-${t.tid}`}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  active
                    ? "border-[var(--cyan)] text-white"
                    : "border-transparent text-[var(--faint)] hover:text-white"
                }`}
              >
                <Icon size={15} />
                {t.label}
                {t.tid === "live" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" />
                )}
              </Link>
            );
          })}
          <Link
            to="/admin"
            data-testid="tab-admin"
            className="ml-auto px-3 py-3 text-[11px] font-mono-x uppercase tracking-widest text-[var(--faint)] hover:text-white transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
