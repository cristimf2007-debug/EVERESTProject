import React, { useEffect, useRef, useState } from "react";

const COLORS = ["var(--accent)", "var(--berry)", "#7fd1a5", "#bfe3ff", "var(--accent)", "#ff8a5c"];

// Ghirlandă de beculețe atârnată curbat sub header; fiecare bec sclipește în ritmul lui
export default function Garland() {
  const ref = useRef(null);
  const [bulbs, setBulbs] = useState([]);
  const [path, setPath] = useState("");

  useEffect(() => {
    const build = () => {
      const w = ref.current?.clientWidth || window.innerWidth;
      const n = Math.max(10, Math.floor(w / 46));
      const sags = 3, seg = w / sags;
      let p = "";
      const pts = [];
      for (let k = 0; k < sags; k++) {
        const a = k * seg, b = a + seg;
        p += `${k ? "" : "M0,2 "}Q${a + seg / 2},22 ${b},2 `;
      }
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const x = t * w;
        const segT = (x % seg) / seg;
        const y = 2 + (22 - 2) * 4 * segT * (1 - segT); // curbă parabolică per segment
        pts.push({ x, y, c: COLORS[i % COLORS.length], d: (0.9 + (i % 5) * 0.22).toFixed(2) + "s" });
      }
      setPath(p);
      setBulbs(pts);
    };
    build();
    window.addEventListener("resize", build);
    return () => window.removeEventListener("resize", build);
  }, []);

  return (
    <div ref={ref} className="absolute left-0 right-0 -bottom-3.5 h-7 pointer-events-none" aria-hidden="true" data-testid="garland">
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <path d={path} fill="none" stroke="rgba(234,242,237,0.25)" strokeWidth="1" />
      </svg>
      {bulbs.map((b, i) => (
        <span key={i} className="bulb" style={{ left: b.x, top: b.y, "--c": b.c, "--d": b.d }} />
      ))}
    </div>
  );
}
