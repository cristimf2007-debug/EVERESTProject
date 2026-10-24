import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Gavel, ShieldCheck, Radio } from "lucide-react";

const LORE = [
  { icon: AlertTriangle, label: "3× strike-uri", sub: "YouTube m-a lovit de trei ori" },
  { icon: Gavel, label: "1× caz penal", sub: "da, pe bune" },
  { icon: ShieldCheck, label: "0 ștergeri aici", sub: "din seif nu dă jos nimeni" },
  { icon: Radio, label: "24/7 live", sub: "radioul cântă non-stop" },
];

// Povestea din spatele site-ului — se deschide din logo-ul mare de pe prima pagină
export default function StoryModal({ onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[150] grid place-items-center px-4 pb-24"
      style={{ background: "rgba(7,9,14,.84)", backdropFilter: "blur(14px)" }}
      data-testid="story-modal"
      onClick={onClose}
    >
      <div
        className="ob-card relative w-full max-w-md p-6 sm:p-8"
        style={{ animation: "player-rise .4s cubic-bezier(.2,.9,.25,1.15) both" }}
        onClick={(e) => e.stopPropagation()}
        data-testid="story-modal-card"
      >
        <button
          onClick={onClose}
          aria-label="Închide"
          data-testid="story-modal-close"
          className="knob knob-sm absolute top-3.5 right-3.5"
        >
          <X />
        </button>

        <p className="badge-engraved">Povestea adevărată</p>
        <h3 className="font-display text-2xl uppercase mt-2">De ce există site-ul ăsta</h3>

        <p className="text-sm text-[var(--text-2)] leading-relaxed mt-4">
          Pentru că YouTube mi-a dat <b className="text-[var(--text)]">3 strike-uri</b> și remixurile mele
          dispare de pe platforme în câteva ore. Pentru că am <b className="text-[var(--text)]">caz penal</b> —
          da, pe bune. Așa că mi-am făcut propriul colț de internet: aici muzica nu se șterge,
          radioul cântă <b className="text-[var(--flame)]">24/7</b> și nimeni nu-mi mai dă strike.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-6">
          {LORE.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-xl border border-[var(--edge)] bg-black/25 px-3.5 py-3">
                <Icon size={14} className="text-[var(--flame)]" />
                <p className="text-sm font-bold mt-1.5 leading-tight">{f.label}</p>
                <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-0.5">{f.sub}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] font-mono-x uppercase tracking-[0.24em] text-[var(--text-3)] text-center mt-6">
          No risks, no hits. — de asta e aici, nu pe YouTube
        </p>
      </div>
    </div>,
    document.body
  );
}
