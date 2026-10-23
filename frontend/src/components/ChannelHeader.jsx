import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Radio, Disc3, Info, BadgeCheck, MessageSquareQuote, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import api, { getSid, mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import { useFan } from "@/context/FanContext";
import Equalizer from "@/components/Equalizer";
import LogoModal from "@/components/LogoModal";
import LoginModal from "@/components/LoginModal";
import NotificationBell from "@/components/NotificationBell";

// tunătoare scurtă și joasă, sintetizată — fără fișier audio
function playThunder() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const dur = 1.1;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown noise
      data[i] = last * 3.2 * Math.pow(1 - i / data.length, 1.6);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 140;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start();
    src.onended = () => ctx.close();
  } catch { /* fără audio context — trecem peste */ }
}

const TABS = [
  { to: "/", label: "Live 24/7", tid: "live", icon: Radio },
  { to: "/piese", label: "Piese", tid: "piese", icon: Disc3 },
  { to: "/pareri", label: "Păreri", tid: "pareri", icon: MessageSquareQuote },
  { to: "/despre", label: "Despre", tid: "despre", icon: Info },
];

export default function ChannelHeader() {
  const location = useLocation();
  const { playing, mode } = useRadio();
  const { me, loginOpen, setLoginOpen, logout } = useFan();
  const [subs, setSubs] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [subEmailOpen, setSubEmailOpen] = useState(false);
  const [subEmail, setSubEmail] = useState(() => localStorage.getItem("bioxic_sub_email") || "");
  const [flash, setFlash] = useState(false);
  const [whisper, setWhisper] = useState(false);

  // easter egg: atingi logo-ul → fulger + tunet + șoaptă, apoi panoul „Cine sunt eu"
  const onLogoTouch = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setShowBio(true); return; }
    setFlash(true);
    setWhisper(true);
    playThunder();
    setTimeout(() => setFlash(false), 350);
    setTimeout(() => setWhisper(false), 2200);
    setTimeout(() => setShowBio(true), 650);
  };

  useEffect(() => {
    // serverul e sursa de adevăr: ține minte abonarea după dispozitiv ȘI după cont/email
    api.get(`/channel/status?sid=${getSid()}`)
      .then((r) => {
        setSubs(r.data.subscribers);
        setSubscribed(!!r.data.subscribed);
        localStorage.setItem("bioxic_sub", r.data.subscribed ? "1" : "0");
      })
      .catch(() => {});
  }, [me]);

  const doSubscribe = async (email) => {
    try {
      const r = await api.post("/channel/subscribe", { sid: getSid(), subscribed: true, email });
      setSubs(r.data.subscribers);
      setSubscribed(true);
      localStorage.setItem("bioxic_sub", "1");
      if (email) localStorage.setItem("bioxic_sub_email", email);
      setSubEmailOpen(false);
      toast.success("Ești abonat la BIOXIC!", { description: "Primești email automat la fiecare piesă nouă." });
    } catch {
      toast.error("Ceva nu a mers. Încearcă din nou.");
    }
  };

  const toggleSub = async () => {
    if (subscribed) {
      setSubscribed(false);
      localStorage.setItem("bioxic_sub", "0");
      try {
        const r = await api.post("/channel/subscribe", { sid: getSid(), subscribed: false, email: subEmail });
        setSubs(r.data.subscribers);
        localStorage.removeItem("bioxic_sub_email");
        toast.info("Ai dezabonat canalul — nu mai primești emailuri.");
      } catch {
        toast.error("Ceva nu a mers. Încearcă din nou.");
      }
      return;
    }
    if (me) {
      // logat — emailul contului e luat automat
      doSubscribe("");
    } else {
      setSubEmailOpen((o) => !o);
    }
  };

  const confirmGuestSub = (e) => {
    e.preventDefault();
    const em = subEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      toast.error("Scrie un email valid ca să primești notificările.");
      return;
    }
    doSubscribe(em);
  };

  return (
    <header data-testid="channel-header" className="relative z-10">
      {/* banner — poza reală, tratament cinematic de Halloween */}
      <div className="relative h-44 sm:h-60 overflow-hidden">
        <img
          src="/artist.jpg"
          alt="BIOXIC"
          className="w-full h-full object-cover object-center"
          style={{ filter: "saturate(0.35) brightness(0.55) contrast(1.08)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,7,.3) 0%, rgba(10,9,7,.65) 55%, var(--night) 100%)" }} />
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 120px 40px rgba(5,4,3,.85)" }} />
        {/* ceață în 2 straturi, viteze diferite */}
        <div className="fog-layer fog-a" />
        <div className="fog-layer fog-b" />
        <button
          onClick={onLogoTouch}
          data-testid="channel-logo"
          aria-label="Cine sunt eu — deschide"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-110 hover:-rotate-2 cursor-pointer"
        >
          {/* lumânare în spatele logo-ului */}
          <span
            className="absolute inset-0 candle-flicker pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(232,115,26,.4), transparent 70%)", transform: "scale(2.4)" }}
          />
          <img
            src="/logo.png"
            alt="BIOXIC"
            className="relative w-44 sm:w-64 drop-shadow-[0_10px_36px_rgba(0,0,0,0.75)]"
          />
        </button>
        {/* badge ediție limitată */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 hidden sm:flex items-center gap-2 rounded-full px-4 py-1.5 border border-[rgba(232,115,26,.5)] bg-black/40 backdrop-blur-sm" data-testid="halloween-badge">
          <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--berry)" }} />
          <span className="text-[9px] font-mono-x uppercase tracking-[0.3em] text-[var(--accent)]">Halloween · Limited 2026</span>
        </div>
      </div>

      {/* profil */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 -mt-9 sm:-mt-12 relative z-10">
          <img
            src="/artist.jpg"
            alt="BIOXIC"
            data-testid="channel-avatar"
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[var(--accent)] shrink-0"
            style={{ boxShadow: "0 0 34px rgba(var(--accent-rgb),.4)", background: "var(--night)" }}
          />
          <div className="min-w-0 pb-1 flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide flex items-center gap-2 leading-none">
              BIOXIC <BadgeCheck size={19} className="text-[var(--accent)] shrink-0" />
            </h1>
            <p className="text-[10px] sm:text-xs text-[var(--mist)] font-mono-x mt-1.5 uppercase tracking-widest truncate">
              <span data-testid="channel-subs-count" className="text-[var(--frost)]">{subs}</span> abonați · No risks, no hits.
            </p>
            <p className="hidden sm:inline-block mt-1.5 text-[8px] font-mono-x uppercase tracking-[0.25em] text-[var(--accent)]/70 border border-[rgba(232,115,26,.3)] rounded px-2 py-0.5" data-testid="edition-tag">
              Edition 31/10/2026 · Nº 001
            </p>
          </div>
          <div className="pb-1 flex items-center gap-2.5 sm:gap-3 shrink-0 order-last sm:order-none w-full sm:w-auto justify-end">
            {playing && mode === "live" && <Equalizer playing className="hidden sm:flex" />}
            <NotificationBell />
            <div className="relative">
              <button
                data-testid="channel-subscribe-button"
                onClick={toggleSub}
                className={subscribed ? "btn-x !py-2.5 text-xs font-bold uppercase tracking-widest" : "btn-x gold !py-2.5 text-xs font-bold uppercase tracking-widest"}
              >
                {subscribed ? "Abonat" : "Abonează-te"}
              </button>
              {subEmailOpen && !subscribed && (
                <form onSubmit={confirmGuestSub} className="absolute right-0 top-12 z-50 glass rounded-2xl p-3 w-64" data-testid="subscribe-email-popover">
                  <p className="text-[11px] text-[var(--mist)] mb-2 leading-snug">Lasă emailul — primești notificare automat la fiecare piesă nouă.</p>
                  <div className="flex gap-2">
                    <input
                      data-testid="subscribe-email-input"
                      type="email"
                      required
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="email@tau.com"
                      className="flex-1 min-w-0 rounded-full bg-black/30 border border-[var(--line)] px-3.5 py-2 text-xs outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
                    />
                    <button data-testid="subscribe-email-confirm" className="btn-x gold !py-2 !px-3.5 text-[10px] font-black uppercase tracking-widest shrink-0">OK</button>
                  </div>
                </form>
              )}
            </div>
            {me ? (
              <div className="relative">
                <button
                  data-testid="header-user-chip"
                  onClick={() => setUserMenu((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-[var(--line-hi)] bg-black/30 pl-1 pr-3 py-1 hover:border-[rgba(var(--accent-rgb),.5)] transition-colors"
                >
                  {me.picture ? (
                    <img src={mediaUrl(me.picture)} alt={me.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid w-8 h-8 rounded-full place-items-center text-xs font-black text-[var(--on-accent)]" style={{ background: "linear-gradient(180deg, var(--accent-hi), var(--accent))" }}>
                      {(me.name || "F")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:block text-xs font-bold max-w-[90px] truncate">{me.name}</span>
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-12 z-50 glass rounded-2xl w-52 p-2" data-testid="header-user-menu">
                    <p className="px-3 py-2 text-xs text-[var(--mist)] truncate">{me.email}</p>
                    <button
                      data-testid="header-logout-button"
                      onClick={() => { setUserMenu(false); logout(); toast.info("Ai ieșit din cont."); }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                    >
                      <LogOut size={14} className="text-[var(--berry)]" /> Ieși din cont
                    </button>
                  </div>
                )}
              </div>
            ) : me === false ? (
              <button
                data-testid="header-login-button"
                onClick={() => setLoginOpen(true)}
                className="btn-x !py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
              >
                <LogIn size={13} /> Intră în cont
              </button>
            ) : null}
          </div>
        </div>

        {/* taburi — underline portocaliu cu glow, stil drop limitat */}
        <nav className="mt-6 border-b border-[var(--line)] overflow-x-auto max-w-full" aria-label="Canal">
          <div className="flex items-center min-w-max sm:min-w-0 sm:justify-center">
            {TABS.map((t) => {
              const active = location.pathname === t.to;
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  data-testid={`tab-${t.tid}`}
                  className={`tab-link ${active ? "active" : ""}`}
                >
                  <Icon size={13} />
                  {t.label}
                  {t.tid === "live" && <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--site-live)" }} />}
                </Link>
              );
            })}
            <Link to="/admin" data-testid="tab-admin" className={`tab-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}>
              Admin
            </Link>
          </div>
        </nav>
      </div>

      {showBio && <LogoModal onClose={() => setShowBio(false)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {flash && <div className="lightning" data-testid="lightning-flash" />}
      {whisper && (
        <div className="fixed inset-0 z-[190] grid place-items-center pointer-events-none">
          <p className="whisper-text font-mono-x text-sm sm:text-lg uppercase text-[var(--frost)]/90 tracking-[0.5em]" data-testid="whisper-text">
            No risks, no hits.
          </p>
        </div>
      )}
    </header>
  );
}
