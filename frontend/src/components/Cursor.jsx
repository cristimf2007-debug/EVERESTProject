import React, { useEffect, useRef, useState } from "react";

// Cursor custom desktop: punct + inel care urmăresc mouse-ul; peste [data-cursor] devine pastilă cu text
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef("");
  const [label, setLabel] = useState("");
  const [enabled] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !document.documentElement.classList.contains("a11y-rm")
  );

  useEffect(() => {
    if (!enabled) return;
    let x = -100, y = -100, rx = -100, ry = -100, raf;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target.closest?.("[data-cursor]");
      const l = t ? t.getAttribute("data-cursor") : "";
      if (l !== labelRef.current) { labelRef.current = l; setLabel(l); }
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    document.documentElement.classList.add("has-cursor");
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className={`cursor-ring ${label ? "labeled" : ""}`} aria-hidden="true" data-testid="custom-cursor">
        <span>{label}</span>
      </div>
    </>
  );
}
