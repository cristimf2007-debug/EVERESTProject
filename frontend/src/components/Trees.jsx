import React, { useMemo } from "react";

// Siluete de brazi pe 3 straturi (efect de adâncime), generate deterministic
export default function Trees() {
  const paths = useMemo(() => {
    let out = "";
    const layer = (n, hMin, hMax, col, op, seed) => {
      let s = seed;
      const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      let d = "";
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 1240 - 20 + r() * 20;
        const h = hMin + r() * (hMax - hMin);
        const w = h * 0.42;
        d += `M${x - w},300 L${x - w * 0.55},${300 - h * 0.35} L${x - w * 0.75},${300 - h * 0.35} L${x - w * 0.35},${300 - h * 0.65} L${x - w * 0.5},${300 - h * 0.65} L${x},${300 - h} L${x + w * 0.5},${300 - h * 0.65} L${x + w * 0.35},${300 - h * 0.65} L${x + w * 0.75},${300 - h * 0.35} L${x + w * 0.55},${300 - h * 0.35} L${x + w},300 Z `;
      }
      out += `<path d="${d}" fill="${col}" opacity="${op}"/>`;
    };
    layer(26, 90, 170, "#0c2219", 0.9, 7);
    layer(18, 120, 230, "#081a13", 1, 31);
    layer(12, 150, 290, "#040e0a", 1, 77);
    return out;
  }, []);

  return (
    <svg className="trees-layer" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"
      data-testid="trees-layer" dangerouslySetInnerHTML={{ __html: paths }} />
  );
}
