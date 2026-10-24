import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// Tranziție între pagini: cortină de obsidian (jos→sus, apoi revelare) ~0.4s
export default function PageCurtain() {
  const { pathname } = useLocation();
  const [phase, setPhase] = useState("idle"); // idle | cover | reveal
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPhase("cover");
    const t1 = setTimeout(() => setPhase("reveal"), 190);
    const t2 = setTimeout(() => setPhase("idle"), 430);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div className={`curtain ${phase}`} aria-hidden="true" data-testid="page-curtain">
      <img src="/logo.png" alt="" className="w-24 opacity-80" />
    </div>
  );
}
