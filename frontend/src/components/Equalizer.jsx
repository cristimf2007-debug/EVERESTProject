import React from "react";

export default function Equalizer({ playing = true, bars = 5, color = "var(--cyan)", className = "" }) {
  return (
    <div className={`flex items-end gap-[3px] h-5 ${playing ? "" : "eq-paused"} ${className}`} data-testid="equalizer" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full"
          style={{
            height: "100%",
            background: color,
            animationDelay: `${i * 0.13}s`,
            animationDuration: `${0.8 + (i % 3) * 0.22}s`,
          }}
        />
      ))}
    </div>
  );
}
