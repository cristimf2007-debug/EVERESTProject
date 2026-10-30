import React, { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import TvBroadcast from "@/components/TvBroadcast";
import TvGuide, { NextPremiereCard } from "@/components/TvGuide";
import LiveChat from "@/components/LiveChat";
import { useRadio } from "@/context/RadioContext";
import api from "@/lib/api";

// Pagina TV — playerul cinematic (logo 2s → clipuri → live), chatul comunității, ghidul săptămânal
export default function TvPage() {
  const { listeners } = useRadio();
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    api.get("/tv/schedule").then((r) => setSchedule(r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12" data-testid="tv-page">
      <header className="rv flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="sec-kicker">Televiziune · Non-stop</p>
          <h1 className="font-display text-4xl sm:text-6xl tracking-tight mt-3">
            BIOXIC <span className="text-[var(--flame)]">TV</span>
          </h1>
          <p className="text-[var(--text-2)] text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
            Manele video non-stop, Full HD — cu chatul comunității alături. Radioul tace automat cât te uiți.
          </p>
        </div>
        <span className="live-badge" data-testid="tv-live-badge-page">
          <span className="live-dot" /> LIVE TV
        </span>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 mt-9 rv">
        {/* playerul cinematic + următoarea emisiune */}
        <section className="min-w-0">
          <TvBroadcast />
          <div className="mt-5 lg:hidden">
            <NextPremiereCard schedule={schedule} />
          </div>
          <div className="glass rounded-2xl p-4 mt-5 flex items-center gap-3 text-xs text-[var(--text-2)] leading-relaxed" data-testid="tv-note">
            <Radio size={14} className="text-[var(--flame)] shrink-0" />
            <span>
              Când apeși play aici, radioul se oprește singur — niciodată două surse deodată.
              Vrei doar muzică? Pagina <a href="/muzica" className="text-[var(--flame)] underline underline-offset-2">Muzică & Radio</a> rămâne sursa principală.
            </span>
          </div>
        </section>

        {/* chatul live al comunității — spațios, pe toată înălțimea */}
        <aside className="min-h-[560px] lg:min-h-0 flex flex-col gap-5" data-testid="tv-chat">
          <div className="hidden lg:block">
            <NextPremiereCard schedule={schedule} />
          </div>
          <div className="flex-1 min-h-[440px]">
            <LiveChat inRoom />
          </div>
        </aside>
      </div>

      {/* ghidul TV pe săptămână */}
      <div className="mt-14">
        <TvGuide schedule={schedule} />
      </div>
    </div>
  );
}
