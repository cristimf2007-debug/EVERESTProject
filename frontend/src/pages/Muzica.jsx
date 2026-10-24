import React from "react";
import LiveConsole from "@/components/LiveConsole";
import Playlisturi from "@/components/Playlisturi";
import Piese from "@/pages/Piese";

// Muzică & Radio — deck-ul live 24/7 + discografie + playlisturi, totul într-o pagină
export default function Muzica() {
  return (
    <div data-testid="muzica-page">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-4 sm:pt-6">
        <header className="rv">
          <p className="badge-engraved">Emisiune continuă · 24/7</p>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight mt-2">
            Muzică & <span className="text-[var(--live)]">Radio</span>
          </h1>
          <p className="text-[var(--text-2)] text-sm mt-3 max-w-xl">
            Radioul cântă non-stop, sincronizat pentru toți ascultătorii. Dedesubt — toată discografia, direct din seif.
          </p>
        </header>
      </div>

      <LiveConsole />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto">
        <p className="badge-engraved mb-1">Discografie completă</p>
        <Piese embedded />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto">
        <p className="badge-engraved mb-5">Playlisturi</p>
        <Playlisturi />
      </div>
    </div>
  );
}
