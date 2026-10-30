import React, { useEffect, useRef, useState } from "react";

// Preloader Obsidian — o singură dată pe sesiune, contor 000→100, logo care se aprinde, max 1.5s
export default function Preloader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem("bioxic_ob_loaded"));
  const [n, setN] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (!show) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    const start = performance.now();
    const DUR = 1150;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / DUR);
      setN(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(finish, 100);
    };
    raf = requestAnimationFrame(tick);
    const hardCap = setTimeout(finish, 1500);
    return () => { cancelAnimationFrame(raf); clearTimeout(hardCap); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    sessionStorage.setItem("bioxic_ob_loaded", "1");
    setLeaving(true);
    setTimeout(() => setShow(false), 480);
  }

  if (!show) return null;

  return (
    <div className={`preloader ${leaving ? "leaving" : ""}`} onClick={finish} data-testid="preloader">
      <img
        src="/logo.png"
        alt="BIOXIC"
        className="preloader-logo"
        style={{ opacity: 0.2 + n * 0.008, filter: `drop-shadow(0 0 ${10 + n * 0.5}px rgba(45,216,240,${0.15 + n * 0.004}))` }}
      />
      <p className="preloader-count" data-testid="preloader-count">{String(n).padStart(3, "0")}</p>
      <p className="preloader-tag">Obsidian · Limited 2026</p>
    </div>
  );
}
