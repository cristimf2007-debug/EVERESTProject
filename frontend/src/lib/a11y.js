const KEY = "bioxic_a11y";

const DEFAULTS = { rm: false, contrast: false, big: false, noflash: false };

export function getA11y() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyA11y(p = getA11y()) {
  const el = document.documentElement;
  el.classList.toggle("a11y-rm", !!p.rm);
  el.classList.toggle("a11y-contrast", !!p.contrast);
  el.classList.toggle("a11y-big", !!p.big);
  el.classList.toggle("a11y-noflash", !!p.noflash);
}

export function setA11y(patch) {
  const next = { ...getA11y(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocat */ }
  applyA11y(next);
  return next;
}
