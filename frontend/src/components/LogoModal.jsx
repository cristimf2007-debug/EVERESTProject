import React, { useRef, useState } from "react";
import { X, MapPin, Eye, Users, Sparkles } from "lucide-react";

const FACTS = [
  { icon: MapPin, label: "România → UK", sub: "manele fără granițe" },
  { icon: Eye, label: "~50M", sub: "vizualizări în total" },
  { icon: Users, label: "Guță · Nek · Șușanu", sub: "colaborări" },
  { icon: Sparkles, label: "No risks, no hits.", sub: "deviza casei" },
];

// Panoul secret din logo — card 3D care urmărește mouse-ul
export default function LogoModal({ onClose }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 16, ry: (px - 0.5) * 18, gx: px * 100, gy: py * 100 });
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center px-4"
      style={{ background: "rgba(6,17,13,.82)", backdropFilter: "blur(14px)" }}
      data-testid="logo-modal"
      onClick={onClose}
    >
      <div style={{ perspective: "1100px" }} onClick={(e) => e.stopPropagation()}>
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={() => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 })}
          className="relative w-[320px] sm:w-[420px] rounded-3xl overflow-hidden border border-[rgba(var(--accent-rgb),.4)]"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform .15s ease-out",
            background: "linear-gradient(160deg, #12352606, #0d241b), var(--pine)",
            boxShadow: "0 40px 90px -20px rgba(0,0,0,.9), 0 0 80px -20px rgba(var(--accent-rgb),.5)",
            animation: "player-rise .5s cubic-bezier(.2,.9,.25,1.2) both",
          }}
          data-testid="logo-modal-card"
        >
          {/* strălucire care urmărește cursorul */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(var(--accent-rgb),.22), transparent 55%)` }}
          />

          {/* poza cu adâncime */}
          <div className="relative h-52 sm:h-64 overflow-hidden" style={{ transform: "translateZ(50px)" }}>
            <img src="/artist.jpg" alt="BIOXIC" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, var(--pine) 100%)" }} />
            <img src="/logo.png" alt="" className="absolute bottom-3 left-1/2 -translate-x-1/2 w-36 drop-shadow-[0_6px_20px_rgba(0,0,0,.8)]" />
          </div>

          <div className="relative p-6 sm:p-7" style={{ transform: "translateZ(30px)" }}>
            <p className="text-[10px] font-mono-x uppercase tracking-[0.3em] text-[var(--accent)]">Cine sunt eu</p>
            <h3 className="font-display text-2xl font-extrabold uppercase mt-1.5">Cristi, aka BIOXIC</h3>
            <p className="text-sm text-[var(--mist)] mt-3 leading-relaxed">
              19 ani. Fac manele și remixuri care nu stau mult pe YouTube — dar rămân aici, în seif.
              Radioul ăsta cântă non-stop, pentru toată lumea, la aceeași secundă.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {FACTS.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="rounded-xl border border-[var(--line)] bg-black/25 px-3.5 py-3">
                    <Icon size={14} className="text-[var(--accent)]" />
                    <p className="text-sm font-bold mt-1.5 leading-tight">{f.label}</p>
                    <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)] mt-0.5">{f.sub}</p>
                  </div>
                );
              })}
            </div>

            <button
              data-testid="logo-modal-close"
              onClick={onClose}
              className="btn-x gold w-full justify-center mt-6 !py-3 text-xs font-black uppercase tracking-[0.2em]"
            >
              Înapoi la muzică
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Închide"
            className="absolute top-3 right-3 grid w-9 h-9 rounded-full place-items-center bg-black/50 border border-[var(--line-hi)] text-[var(--frost)] hover:text-[var(--accent)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
