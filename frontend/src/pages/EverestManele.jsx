import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mountain, Music2, BadgeCheck, ArrowRight } from "lucide-react";
import api from "@/lib/api";

// Everest Manele — pagina casei de discuri fondată de BIOXIC
export default function EverestManele() {
  const [counts, setCounts] = React.useState({ tracks: null, videos: null });

  React.useEffect(() => {
    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
    ]).then(([t, v]) => setCounts({ tracks: (t.data || []).length, videos: (v.data || []).length }));
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-16" data-testid="everest-page">
      <Link to="/" className="btn-ghost rounded-full px-4 py-2 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid="everest-back">
        <ArrowLeft size={12} /> Acasă
      </Link>

      <header className="mt-8 rv">
        <p className="sec-kicker"><Mountain size={12} /> Casa de discuri</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-4">Everest Manele</h1>
        <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-5 max-w-2xl">
          Label independent fondat de BIOXIC (Cristian Maxim) — acasă pentru remixuri, mashup-uri și producții
          făcute fără compromisuri. Sub Everest Manele, muzica iese direct din studio la oameni:
          fără intermediari, fără ștergeri, fără filtre.
        </p>
      </header>

      {/* cifre reale din catalog */}
      <section className="grid grid-cols-3 gap-3.5 mt-12 rv" data-testid="everest-stats">
        {[
          { num: counts.tracks ?? "—", label: "Producții lansate" },
          { num: counts.videos ?? "—", label: "Videoclipuri" },
          { num: "1", label: "Sample pack oficial" },
        ].map((s) => (
          <div key={s.label} className="stat-tile p-5 sm:p-6 text-center">
            <p className="stat-num">{s.num}</p>
            <p className="text-[9px] sm:text-[10px] font-mono-x uppercase tracking-[0.18em] text-[var(--text-3)] mt-2">{s.label}</p>
          </div>
        ))}
      </section>

      {/* identitatea label-ului */}
      <section className="grid md:grid-cols-2 gap-10 mt-16 rv">
        <div className="hero-portrait aspect-[4/3]">
          <img src="/artist.jpg" alt="Everest Manele — studio" className="!object-top" loading="lazy" />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="font-display text-2xl sm:text-3xl">Direct din studio, direct la oameni</h2>
          <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-4">
            Fiecare lansare Everest Manele e produsă, mixată și masterizată de BIOXIC.
            Label-ul există ca răspuns la platformele care ștergeau remixurile în câteva ore —
            aici, catalogul rămâne intact și disponibil pentru comunitate.
          </p>
          <p className="flex items-center gap-2 text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] mt-5">
            <BadgeCheck size={12} className="text-[var(--flame)]" /> Label independent · România
          </p>
        </div>
      </section>

      {/* produsele label-ului */}
      <section className="mt-16 rv" data-testid="everest-products">
        <p className="sec-kicker">De la label</p>
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          <Link to="/sample-pack" className="news-card group p-6 sm:p-7 flex items-center gap-5" data-testid="everest-to-samplepack">
            <span className="grid place-items-center w-14 h-14 rounded-2xl shrink-0" style={{ background: "linear-gradient(180deg,#E06D44,#9E3C1B)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 10px 22px -8px rgba(200,90,50,.5)" }}>
              <Music2 size={20} color="#fff" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg">Sample Pack Vol. 1</span>
              <span className="block text-[11px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1">Sunetele oficiale Everest Manele</span>
            </span>
            <ArrowRight size={17} className="text-[var(--text-3)] group-hover:text-[var(--flame)] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
          <Link to="/contact" className="news-card group p-6 sm:p-7 flex items-center gap-5" data-testid="everest-to-contact">
            <span className="knob !w-14 !h-14 !rounded-2xl shrink-0" style={{ color: "var(--flame)" }}>
              <BadgeCheck size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg">Semnează cu noi</span>
              <span className="block text-[11px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1">Colaborări & artiști noi</span>
            </span>
            <ArrowRight size={17} className="text-[var(--text-3)] group-hover:text-[var(--flame)] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
