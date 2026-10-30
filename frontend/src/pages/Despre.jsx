import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, AlertTriangle, Gavel, ShieldCheck, Radio, Music2, Clapperboard, Users, ArrowRight, MapPin, Sparkles } from "lucide-react";
import api from "@/lib/api";

const COLABS = ["Nek Music", "LuCash", "AMMA", "Big Up", "Bogdan de la Ploiești", "Costel Biju", "Jador"];

// Despre BIOXIC — prezentare editorială, doar fapte reale comunicate de artist
export default function Despre() {
  const [counts, setCounts] = useState({ tracks: null, videos: null });

  useEffect(() => {
    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
    ]).then(([t, v]) => setCounts({ tracks: (t.data || []).length, videos: (v.data || []).length }));
  }, []);

  const cifre = [
    { icon: Music2, num: counts.tracks ?? "—", label: "Piese în seif" },
    { icon: Clapperboard, num: counts.videos ?? "—", label: "Videoclipuri" },
    { icon: Radio, num: "24/7", label: "Radio live, non-stop" },
    { icon: ShieldCheck, num: "0", label: "Ștergeri aici" },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-14" data-testid="despre-page">
      {/* hero editorial */}
      <header className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-center rv">
        <div>
          <p className="sec-kicker">Despre artist</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-4 leading-[1.04]">
            BIOXIC este <span className="text-[var(--flame)]">Cristian Maxim</span>
          </h1>
          <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-5 max-w-xl">
            Cristi, 19 ani, din Focșani — producător și artist independent. Sub numele BIOXIC și umbrella-ul
            Everest Music construiește remixuri, mashup-uri și manele care se aud întâi aici, nu pe platformele mari.
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)]">
            <span className="inline-flex items-center gap-1.5"><MapPin size={11} /> Focșani, România</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck size={11} className="text-[var(--flame)]" /> Proiect verificat</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles size={11} /> Everest Music</span>
          </p>
        </div>
        <div className="ob-card p-2.5 rotate-1 hover:rotate-0 transition-transform duration-500">
          <img src="/artist.jpg" alt="Cristian Maxim — BIOXIC" className="w-full aspect-[4/5] object-cover rounded-2xl" data-testid="despre-photo" />
        </div>
      </header>

      {/* cifre reale, evidențiate discret */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-14 rv" data-testid="despre-stats">
        {cifre.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="ob-card p-5 text-center">
              <Icon size={16} className="mx-auto text-[var(--flame)]" />
              <p className="stat-num mt-3">{c.num}</p>
              <p className="text-[10px] font-mono-x uppercase tracking-[0.18em] text-[var(--text-3)] mt-1.5">{c.label}</p>
            </div>
          );
        })}
      </section>

      {/* povestea — secțiuni aerisite */}
      <section className="mt-16 space-y-14">
        <article className="grid md:grid-cols-2 gap-8 items-start rv">
          <div>
            <p className="sec-kicker">Capitolul 1</p>
            <h2 className="sec-title mt-3">Începuturile</h2>
          </div>
          <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed">
            Cristian a început producția muzicală singur, din camera lui, cu un laptop și urechile lipite de boxe.
            Fără studii de profil, fără echipă — doar ore întregi de încercări, sampling și mixat până dimineață.
            Așa s-a născut BIOXIC: un proiect care transformă manelele și hiturile cunoscute în remixuri cu identitate proprie.
          </p>
        </article>

        <article className="grid md:grid-cols-2 gap-8 items-start rv">
          <div>
            <p className="sec-kicker">Capitolul 2</p>
            <h2 className="sec-title mt-3">„Sună și mergem" și colaborările</h2>
          </div>
          <div className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed">
            <p>
              Mashup-ul <b className="text-[var(--text)]">„Sună și mergem" (BIOXIC & KET)</b> a fost momentul care a
              dus proiectul mai departe de camera din Focșani. De acolo, numele BIOXIC a ajuns pe piese alături de{" "}
              {COLABS.slice(0, -1).join(", ")} și {COLABS[COLABS.length - 1]}.
            </p>
            <Link to="/clipuri" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2 mt-5" data-testid="despre-to-clips">
              Vezi clipurile <ArrowRight size={12} />
            </Link>
          </div>
        </article>

        <article className="grid md:grid-cols-2 gap-8 items-start rv">
          <div>
            <p className="sec-kicker">Capitolul 3</p>
            <h2 className="sec-title mt-3">De ce platformă proprie</h2>
          </div>
          <div className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed">
            <p>
              YouTube i-a dat <b className="text-[var(--text)]">3 strike-uri</b>, iar remixurile dispăreau de pe platforme
              în câteva ore. A trecut chiar și printr-un <b className="text-[var(--text)]">caz penal</b> — da, pe bune.
              Așa că și-a construit propriul colț de internet: aici muzica nu se șterge, radioul cântă 24/7
              și nimeni nu-i mai dă strike. <span className="text-[var(--flame)]">No risks, no hits.</span>
            </p>
            <div className="grid grid-cols-3 gap-2.5 mt-6">
              {[
                { icon: AlertTriangle, l: "3× strike-uri" },
                { icon: Gavel, l: "1× caz penal" },
                { icon: ShieldCheck, l: "0 ștergeri aici" },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.l} className="rounded-xl border border-[var(--edge)] bg-black/25 px-3 py-3 text-center">
                    <Icon size={14} className="mx-auto text-[var(--flame)]" />
                    <p className="text-[11px] font-bold mt-1.5 leading-tight">{f.l}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="grid md:grid-cols-2 gap-8 items-start rv">
          <div>
            <p className="sec-kicker">Capitolul 4</p>
            <h2 className="sec-title mt-3">Comunitatea și viziunea</h2>
          </div>
          <div className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed">
            <p>
              BIOXIC nu e doar un catalog de piese — e o comunitate. Fanii vorbesc pe chatul live, cer piese,
              stau de vorbă pe Discord (BIOXIC House) și aud premierele înaintea oricui. Viziunea e simplă:
              muzică făcută direct din seif, fără intermediari, pentru oamenii care chiar ascultă.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <Link to="/muzica" className="btn-flame !h-11 !px-6 !text-[10px]" data-testid="despre-to-music">Ascultă radioul</Link>
              <Link to="/contact" className="btn-steel !h-11 !px-6 !text-[10px]" data-testid="despre-to-contact">Contact & booking</Link>
            </div>
          </div>
        </article>
      </section>

      {/* bandă finală */}
      <section className="ob-card mt-16 p-8 sm:p-10 text-center rv" data-testid="despre-cta">
        <Users size={22} className="mx-auto text-[var(--flame)] mb-4" />
        <h2 className="font-display text-2xl sm:text-3xl">Fii parte din poveste</h2>
        <p className="text-[var(--text-2)] text-sm mt-3 max-w-md mx-auto leading-relaxed">
          Intră în comunitate, lasă o părere și ascultă următoarea premieră chiar aici.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/pareri" className="btn-steel !h-11 !px-6 !text-[10px]" data-testid="despre-to-reviews">Părerile fanilor</Link>
          <Link to="/tv" className="btn-ghost rounded-full px-6 h-11 inline-flex items-center text-[10px] font-mono-x uppercase tracking-widest" data-testid="despre-to-tv">BIOXIC TV live</Link>
        </div>
      </section>
    </div>
  );
}
