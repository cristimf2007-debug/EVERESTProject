import React from "react";
import { Play, Pause, Loader2 } from "lucide-react";

const R = 40;
const C = 2 * Math.PI * R;

// Knob de play 72px, obsidian, cu inel portocaliu de progres — folosit în consolă și camera live
export default function PlayKnob({ pct = 0, playing, loading, onToggle, ringRef, testid = "radio-play-button" }) {
  return (
    <div className="relative w-[88px] h-[88px] shrink-0">
      <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2.5" />
        <circle
          ref={ringRef}
          cx="44" cy="44" r={R} fill="none"
          stroke="var(--flame)" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ filter: "drop-shadow(0 0 6px rgba(45,216,240,.7))", transition: "stroke-dashoffset .3s linear" }}
        />
      </svg>
      <button
        data-testid={testid}
        onClick={onToggle}
        disabled={loading}
        aria-label={playing ? "Pauză" : "Ascultă live"}
        className="knob knob-xl absolute inset-2 !w-[72px] !h-[72px]"
        style={playing ? { color: "var(--flame)" } : {}}
      >
        {loading ? <Loader2 size={24} className="animate-spin" />
          : playing ? <Pause size={24} fill="currentColor" />
          : <Play size={24} fill="currentColor" className="ml-1" />}
      </button>
    </div>
  );
}
