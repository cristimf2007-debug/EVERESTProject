import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Download, ShieldCheck, Music2, Check } from "lucide-react";

const PAYPAL_URL = "https://www.paypal.com/ncp/payment/47UXM5YBBLLPQ";

const INCLUDES = [
  "Primul sample pack oficial Everest Manele",
  "Creat în contextul producțiilor BIOXIC",
  "Produs digital disponibil prin checkout-ul oficial PayPal",
  "Detaliile de livrare sunt confirmate în fluxul de cumpărare",
];

// Sample Pack Vol. 1 — pagina produsului digital al label-ului
export default function SamplePack() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-16" data-testid="samplepack-page">
      <Link to="/" className="btn-ghost rounded-full px-4 py-2 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid="sp-back">
        <ArrowLeft size={12} /> Acasă
      </Link>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 mt-10 items-start">
        {/* vizual produs — construit în cod, nu imagine */}
        <div className="lg:col-span-5 rv">
          <div className="cta-band p-8 sm:p-10 aspect-square flex flex-col justify-between" data-testid="sp-cover">
            <div className="relative">
              <p className="font-mono-x text-[9px] uppercase tracking-[0.3em] text-[#E8B48F]">Everest Manele</p>
              <p className="font-display font-extrabold text-5xl sm:text-6xl leading-[0.95] mt-4">
                SAMPLE<br />PACK<br /><span className="text-[#E06D44]">VOL. 1</span>
              </p>
            </div>
            <div className="relative flex items-end justify-between">
              <p className="font-mono-x text-[9px] uppercase tracking-[0.3em] text-[#D6CFC4]">Produs de BIOXIC</p>
              <span className="grid place-items-center w-12 h-12 rounded-full" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)" }}>
                <Music2 size={18} color="#E8B48F" />
              </span>
            </div>
          </div>
        </div>

        {/* detalii + cumpărare */}
        <div className="lg:col-span-7 rv rv-d1">
          <p className="sec-kicker"><Package size={12} /> Produs digital</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight mt-4">Sample Pack Vol. 1</h1>
          <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-5 max-w-xl">
            Primul pachet oficial de sunete Everest Manele. Aceleași texturi și drumuri care stau
            la baza producțiilor BIOXIC — acum disponibile pentru propriile tale piese.
          </p>

          <ul className="mt-7 space-y-3" data-testid="sp-includes">
            {INCLUDES.map((i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-2)]">
                <span className="grid place-items-center w-5 h-5 rounded-full mt-0.5 shrink-0" style={{ background: "rgba(var(--flame-rgb),.1)", border: "1px solid rgba(var(--flame-rgb),.35)" }}>
                  <Check size={11} style={{ color: "var(--flame)" }} />
                </span>
                {i}
              </li>
            ))}
          </ul>

          <div className="news-card p-6 sm:p-7 mt-9" data-testid="sp-buy-card">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="font-mono-x text-[9px] uppercase tracking-[0.24em] text-[var(--text-3)]">Plată sigură</p>
                <p className="font-display text-xl mt-1.5">Cumpără direct de la artist</p>
              </div>
              <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="btn-flame !h-13 !px-9" data-testid="sp-buy-button">
                Cumpără cu PayPal
              </a>
            </div>
            <p className="flex items-center gap-2 text-[11px] text-[var(--text-3)] mt-4">
              <ShieldCheck size={13} className="text-[var(--flame)]" /> Tranzacție procesată de PayPal · <Download size={13} className="text-[var(--flame)]" /> Primești pachetul după confirmare
            </p>
          </div>

          <p className="text-[11px] text-[var(--text-3)] leading-relaxed mt-5">
            Întrebări despre pachet sau licențiere? <Link to="/contact" className="text-[var(--flame)] underline underline-offset-2">Scrie-mi</Link> și îți răspund personal.
          </p>
        </div>
      </div>
    </div>
  );
}
