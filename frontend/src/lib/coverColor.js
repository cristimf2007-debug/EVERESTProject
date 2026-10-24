// Culoarea dominantă dintr-un cover (canvas mic 24×24, pixelii saturați contează mai mult). Fallback: null → flame.
const cache = new Map();

export async function dominantColor(url) {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const pr = d[i], pg = d[i + 1], pb = d[i + 2];
      const mx = Math.max(pr, pg, pb);
      const mn = Math.min(pr, pg, pb);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const w = 0.3 + sat * 0.7;
      r += pr * w; g += pg * w; b += pb * w; n += w;
    }
    const col = n ? { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) } : null;
    cache.set(url, col);
    return col;
  } catch {
    cache.set(url, null);
    return null;
  }
}
