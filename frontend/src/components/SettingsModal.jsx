import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Accessibility } from "lucide-react";
import { getA11y, setA11y } from "@/lib/a11y";

const ROWS = [
  { k: "rm", label: "Mișcare redusă", desc: "Oprește vizualizările, particulele, fumul și scroll-ul fluid.", tid: "settings-a11y-rm" },
  { k: "contrast", label: "Contrast ridicat", desc: "Text și contururi mai clare pe fundal închis.", tid: "settings-a11y-contrast" },
  { k: "big", label: "Text mai mare", desc: "Mărește toate textele cu ~12%.", tid: "settings-a11y-big" },
  { k: "noflash", label: "Fără clipiri", desc: "Oprește lumânarea, pulsul LIVE, fulgerul și egalizatorul.", tid: "settings-a11y-noflash" },
];

// Setări → Accesibilitate (preferințe păstrate local, aplicate instant)
export default function SettingsModal({ onClose }) {
  const [prefs, setPrefs] = useState(getA11y());

  const toggle = (k) => setPrefs(setA11y({ [k]: !prefs[k] }));

  return createPortal(
    <div
      className="fixed inset-0 z-[170] grid place-items-center px-4"
      style={{ background: "rgba(5,5,5,.78)", backdropFilter: "blur(14px)" }}
      data-testid="settings-modal"
      onClick={onClose}
    >
      <div className="ob-card w-full max-w-md p-6" style={{ animation: "player-rise .35s cubic-bezier(.2,.9,.25,1.1) both" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2.5 font-display text-lg uppercase">
            <Accessibility size={17} className="text-[var(--flame)]" /> Accesibilitate
          </p>
          <button onClick={onClose} aria-label="Închide setările" data-testid="settings-close" className="knob knob-sm"><X /></button>
        </div>
        <p className="text-xs text-[var(--text-2)] mt-2 leading-relaxed">
          Site-ul respectă automat setările sistemului (reduced motion / contrast). Aici le poți forța manual.
        </p>
        <div className="grid gap-2.5 mt-5">
          {ROWS.map((r) => (
            <button
              key={r.k}
              role="switch"
              aria-checked={!!prefs[r.k]}
              onClick={() => toggle(r.k)}
              data-testid={r.tid}
              className="queue-row flex items-center gap-4 rounded-xl border border-[var(--edge)] px-4 py-3.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{r.label}</span>
                <span className="block text-[11px] text-[var(--text-2)] mt-0.5 leading-snug">{r.desc}</span>
              </span>
              <span className="switch" aria-hidden="true" data-state={prefs[r.k] ? "on" : "off"} />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
