import React, { useEffect, useRef, useState } from "react";

const TEXT = "HALLOWEEN LIMITED 2026";

// Intro cinematografic — o singură dată pe sesiune, skippable la click
export default function HalloweenIntro() {
  const [show, setShow] = useState(() => !sessionStorage.getItem("bioxic_h26_intro"));
  const [leaving, setLeaving] = useState(false);
  const [typed, setTyped] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!show) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const typeTimer = setInterval(() => {
      setTyped((t) => {
        if (t >= TEXT.length) { clearInterval(typeTimer); return t; }
        return t + 1;
      });
    }, 55);
    const endTimer = setTimeout(finish, 2600);
    return () => { clearInterval(typeTimer); clearTimeout(endTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    sessionStorage.setItem("bioxic_h26_intro", "1");
    setLeaving(true);
    setTimeout(() => setShow(false), 620);
  }

  if (!show) return null;

  return (
    <div className={`intro-overlay ${leaving ? "leaving" : ""}`} onClick={finish} data-testid="halloween-intro">
      {/* ceață care se ridică */}
      <div className="absolute inset-0 intro-fog overflow-hidden">
        <div className="fog-layer fog-a" />
        <div className="fog-layer fog-b" />
      </div>
      <div className="relative text-center px-6">
        <div className="relative inline-block intro-logo">
          <div
            className="absolute inset-0 candle-flicker"
            style={{ background: "radial-gradient(circle, rgba(232,115,26,.35), transparent 70%)", transform: "scale(2.2)" }}
          />
          <img src="/logo.png" alt="BIOXIC" className="relative w-52 sm:w-72 mx-auto" />
        </div>
        <p className="intro-type text-[11px] sm:text-xs text-[var(--accent)] mt-8 uppercase" data-testid="intro-typed">
          {TEXT.slice(0, typed)}<span className="intro-caret">▍</span>
        </p>
      </div>
    </div>
  );
}
