import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Music2, ArrowRight, MapPin, Mountain, ArrowLeft, CalendarDays, Globe2 } from "lucide-react";

const TIMELINE = [
  {
    era: "2007",
    title: "Începuturile în Vrancea",
    text: "Cristian Maxim s-a născut pe 1 martie 2007, în Focșani, și a crescut în Jăriștea, Vrancea.",
  },
  {
    era: "Parcurs creativ",
    title: "Aproape 8 ani de producție",
    text: "BIOXIC dezvoltă remixuri, mashup-uri și producții muzicale, construind o identitate proprie în studio.",
  },
  {
    era: "Prezent",
    title: "Între România și Regatul Unit",
    text: "Activ între România și Regatul Unit, Cristian continuă să lucreze sub numele BIOXIC și să dezvolte proiecte muzicale independente.",
  },
  {
    era: "Everest Manele",
    title: "O casă de discuri independentă",
    text: "Everest Manele este label-ul fondat de BIOXIC și locul în care își prezintă proiectele și Sample Pack Vol. 1.",
  },
];

// Despre BIOXIC — biografia completă a lui Cristian Maxim, editorială, cu cronologie
export default function Despre() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-16" data-testid="despre-page">
      <Link to="/" className="btn-ghost rounded-full px-4 py-2 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid="despre-back">
        <ArrowLeft size={12} /> Acasă
      </Link>

      {/* hero editorial */}
      <header className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center mt-10 rv">
        <div className="lg:col-span-7">
          <p className="sec-kicker">Povestea completă</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-4 leading-[1.04]">
            Cristian Maxim<br /><span className="text-[var(--flame)]">— BIOXIC</span>
          </h1>
          <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-5 max-w-xl">
            Producător muzical român, cunoscut ca BIOXIC. Realizează remixuri, mashup-uri și producții,
            fiind fondatorul casei de discuri Everest Manele.
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)]">
            <span className="inline-flex items-center gap-1.5"><MapPin size={11} /> Focșani · Jăriștea, Vrancea</span>
            <span className="inline-flex items-center gap-1.5"><Globe2 size={11} className="text-[var(--flame)]" /> România · Regatul Unit</span>
            <span className="inline-flex items-center gap-1.5"><Mountain size={11} /> Everest Manele</span>
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="hero-portrait aspect-[4/5] max-w-[400px] mx-auto rotate-1 hover:rotate-0 transition-transform duration-500" data-testid="despre-photo">
            <img src="/artist.jpg" alt="Cristian Maxim — BIOXIC" />
          </div>
        </div>
      </header>

      {/* cronologia — experiență vizuală, nu articol lung */}
      <section className="mt-20 rv" data-testid="despre-timeline">
        <p className="sec-kicker">Cronologie</p>
        <h2 className="sec-title mt-4">Drumul până aici</h2>
        <div className="mt-10 relative">
          <span className="absolute left-[7px] sm:left-1/2 top-2 bottom-2 w-px bg-[var(--edge-hi)] sm:-translate-x-1/2" aria-hidden="true" />
          <div className="space-y-10">
            {TIMELINE.map((t, i) => (
              <article key={t.era} className={`relative grid sm:grid-cols-2 gap-4 sm:gap-12 items-start pl-7 sm:pl-0 rv ${i % 2 ? "" : ""}`} data-testid={`timeline-${i}`}>
                <span className="absolute left-0 sm:left-1/2 top-1.5 w-4 h-4 rounded-full sm:-translate-x-1/2 shrink-0"
                  style={{ background: "linear-gradient(180deg,#E06D44,#9E3C1B)", boxShadow: "0 4px 12px -2px rgba(200,90,50,.5), inset 0 1px 0 rgba(255,255,255,.4)", border: "3px solid var(--void)" }}
                  aria-hidden="true" />
                <div className={i % 2 ? "sm:col-start-2" : "sm:text-right"}>
                  <p className="font-mono-x text-[9px] uppercase tracking-[0.26em] text-[var(--flame)]">{t.era}</p>
                  <h3 className="font-display text-xl sm:text-2xl mt-2">{t.title}</h3>
                </div>
                <p className={`text-sm text-[var(--text-2)] leading-relaxed ${i % 2 ? "sm:col-start-1 sm:row-start-1 sm:text-right" : ""}`}>
                  {t.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* realizări reale, discrete */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-20 rv" data-testid="despre-stats">
        {[
        { icon: CalendarDays, num: "2007", label: "Născut pe 1 martie" },
        { icon: Music2, num: "~8 ani", label: "Experiență în producție" },
        { icon: BadgeCheck, num: "50M+", label: "Vizualizări cumulate" },
        { icon: Mountain, num: "1", label: "Label fondat: Everest Manele" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="stat-tile p-5 text-center">
              <Icon size={15} className="mx-auto text-[var(--flame)]" />
              <p className="stat-num !text-3xl mt-3">{c.num}</p>
              <p className="text-[9px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-2 leading-relaxed">{c.label}</p>
            </div>
          );
        })}
      </section>

      {/* viziunea */}
      <section className="mt-20 rv">
        <div className="cta-band p-8 sm:p-12" data-testid="despre-vision">
          <div className="relative max-w-2xl">
            <p className="font-mono-x text-[10px] uppercase tracking-[0.28em] text-[#E8B48F]">Viziunea</p>
            <h2 className="font-display text-3xl sm:text-4xl tracking-tight mt-4">Muzică fără intermediari</h2>
            <p className="text-[#D6CFC4] text-sm sm:text-base leading-relaxed mt-5">
              BIOXIC este spațiul creativ al lui Cristian Maxim. Prin Everest Manele, proiectele muzicale,
              remixurile, mashup-urile și resursele digitale sunt prezentate într-un loc direct și independent.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/everest-manele" className="btn-flame !h-11 !px-6" data-testid="despre-to-label">Everest Manele</Link>
              <Link to="/contact" className="btn-ghost rounded-full h-11 px-6 inline-flex items-center gap-2 text-[10px] font-mono-x uppercase tracking-widest !text-[#D6CFC4] !border-white/25 hover:!bg-white/10" data-testid="despre-to-contact">
                Contact <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
