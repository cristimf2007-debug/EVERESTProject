import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Radio, Disc3, ListMusic } from "lucide-react";
import LiveConsole from "@/components/LiveConsole";
import Playlisturi from "@/components/Playlisturi";
import Piese from "@/pages/Piese";

const SEGMENTS = [
  { to: "/muzica", key: "live", label: "Live", icon: Radio, tid: "seg-live", exact: true },
  { to: "/muzica/piese", key: "piese", label: "Piese", icon: Disc3, tid: "seg-piese" },
  { to: "/muzica/playlisturi", key: "playlisturi", label: "Playlisturi", icon: ListMusic, tid: "seg-playlisturi" },
];

// Muzică — Live · Piese · Playlisturi, secțiuni interne cu control segmentat
export default function Muzica() {
  const { pathname } = useLocation();
  const sub = pathname.split("/")[2] || "live";
  const section = ["live", "piese", "playlisturi"].includes(sub) ? sub : "live";

  return (
    <div data-testid="muzica-page">
      <div className="sticky top-[74px] z-40 flex justify-center px-4 pointer-events-none">
        <div className="seg-control pointer-events-auto" data-testid="muzica-segments" role="tablist" aria-label="Secțiuni muzică">
          {SEGMENTS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <Link key={s.key} to={s.to} role="tab" aria-selected={active} data-testid={s.tid} className={`seg-link ${active ? "active" : ""}`}>
                <Icon size={13} /> {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {section === "live" && <LiveConsole />}
      {section !== "live" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
          {section === "piese" && <Piese embedded />}
          {section === "playlisturi" && <Playlisturi />}
        </div>
      )}
    </div>
  );
}
