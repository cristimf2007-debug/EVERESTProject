import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Disc3, Clapperboard, LogIn, LogOut, Search, ShieldCheck, Settings, CircleUserRound } from "lucide-react";
import { toast } from "sonner";
import api, { getSid, mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import { useFan } from "@/context/FanContext";
import LogoModal from "@/components/LogoModal";
import LoginModal from "@/components/LoginModal";
import NotificationBell from "@/components/NotificationBell";
import SearchOverlay from "@/components/SearchOverlay";
import SettingsModal from "@/components/SettingsModal";

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
      last = (last + 0.02 * white) / 1.02;
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
  { to: "/", label: "Acasă", tid: "acasa", dot: null },
  { to: "/muzica", label: "Muzică", tid: "muzica", dot: "muzica" },
  { to: "/clipuri", label: "Video", tid: "video", dot: "video" },
];

const MTABS = [
  { to: "/", label: "Acasă", tid: "acasa", icon: Home, dot: null },
  { to: "/muzica", label: "Muzică", tid: "muzica", icon: Disc3, dot: "muzica" },
  { to: "/clipuri", label: "Video", tid: "video", icon: Clapperboard, dot: "video" },
];

const isActiveTab = (to, pathname) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

// Header Obsidian — pilulă plutitoare cu 3 taburi + avatar; pe mobil: bară jos cu icoane + avatar
export default function ChannelHeader() {
  const location = useLocation();
  const { listeners } = useRadio();
  const { me, loginOpen, setLoginOpen, logout } = useFan();
  const [subs, setSubs] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [subEmailOpen, setSubEmailOpen] = useState(false);
  const [subEmail, setSubEmail] = useState(() => localStorage.getItem("bioxic_sub_email") || "");
  const [flash, setFlash] = useState(false);
  const [whisper, setWhisper] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dots, setDots] = useState({ muzica: 0, video: 0 });

  // easter egg: atingi logo-ul → fulger + tunet + șoaptă, apoi panoul „Cine sunt eu"
  const onLogoTouch = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-noflash");
    if (reduced) { setShowBio(true); return; }
    setFlash(true);
    setWhisper(true);
    playThunder();
    setTimeout(() => setFlash(false), 350);
    setTimeout(() => setWhisper(false), 2200);
    setTimeout(() => setShowBio(true), 650);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // meniul de cont se închide la navigare
  useEffect(() => { setUserMenu(false); setSubEmailOpen(false); }, [location.pathname]);

  // puncte portocalii pe taburile cu noutăți + deschiderea Setărilor din footer
  useEffect(() => {
    const onCounts = (e) => setDots({ muzica: e.detail?.muzica || 0, video: e.detail?.video || 0 });
    const onSettings = () => setSettingsOpen(true);
    window.addEventListener("bioxic:new-counts", onCounts);
    window.addEventListener("bioxic:open-settings", onSettings);
    return () => {
      window.removeEventListener("bioxic:new-counts", onCounts);
      window.removeEventListener("bioxic:open-settings", onSettings);
    };
  }, []);

  // dacă există sesiune de admin (cookie httpOnly), meniul arată „Panou admin"
  useEffect(() => {
    api.get("/auth/me").then(() => setIsAdmin(true)).catch(() => {});
  }, []);

  useEffect(() => {
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
    if (me) doSubscribe("");
    else setSubEmailOpen((o) => !o);
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

  const avatar = me ? (
    me.picture ? (
      <img src={mediaUrl(me.picture)} alt={me.name} className="w-full h-full object-cover" />
    ) : (
      <span className="grid w-full h-full place-items-center text-xs font-black text-[#140800]" style={{ background: "linear-gradient(180deg, var(--accent-hi), var(--flame))" }}>
        {(me.name || "F")[0].toUpperCase()}
      </span>
    )
  ) : null;

  return (
    <>
      <header data-testid="channel-header" className="fixed inset-x-0 top-3 z-[110] flex justify-center px-3 pointer-events-none">
        <div className={`hdr-pill pointer-events-auto ${scrolled ? "scrolled" : ""}`}>
          <button onClick={onLogoTouch} data-testid="channel-logo" aria-label="Cine sunt eu — deschide" className="hdr-logo">
            <img src="/logo-alt.png" alt="BIOXIC" />
            <span className="hdr-word">BIOXIC</span>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navigație principală">
            {TABS.map((t) => (
              <Link key={t.to} to={t.to} data-testid={`tab-${t.tid}`} className={`hdr-link ${isActiveTab(t.to, location.pathname) ? "active" : ""}`}>
                {t.label}
                {t.dot && dots[t.dot] > 0 && <span className="tab-dot" aria-label={`${dots[t.dot]} noutăți`} />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <span className="hdr-live" data-testid="header-live-pill">
              <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--live)" }} />
              LIVE{listeners > 0 ? ` · ${listeners}` : ""}
            </span>
            <button className="knob knob-sm" data-testid="search-knob" onClick={() => setSearchOpen(true)} aria-label="Caută pe site">
              <Search />
            </button>
            <NotificationBell />
            <div className="relative">
              <button
                data-testid="channel-subscribe-button"
                onClick={toggleSub}
                className={subscribed ? "btn-steel !h-9 !px-4 !text-[10px]" : "btn-flame !h-9 !px-4 !text-[10px]"}
              >
                {subscribed ? "Abonat" : "Abonează-te"}
              </button>
              {subEmailOpen && !subscribed && (
                <form onSubmit={confirmGuestSub} className="absolute right-0 top-12 z-50 glass rounded-2xl p-3 w-64" data-testid="subscribe-email-popover">
                  <p className="text-[11px] text-[var(--text-2)] mb-2 leading-snug">Lasă emailul — primești notificare automat la fiecare piesă nouă.</p>
                  <div className="flex gap-2">
                    <input
                      data-testid="subscribe-email-input"
                      type="email"
                      required
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="email@tau.com"
                      className="input-recessed flex-1 min-w-0 !rounded-full px-3.5 py-2 text-xs outline-none"
                    />
                    <button data-testid="subscribe-email-confirm" className="btn-flame !h-8 !px-3.5 !text-[10px] shrink-0">OK</button>
                  </div>
                </form>
              )}
            </div>
            {/* avatar pe desktop; pe mobil e în bara de jos */}
            {me ? (
              <button
                data-testid="header-user-chip"
                onClick={() => setUserMenu((o) => !o)}
                className="hdr-desktop-only w-9 h-9 rounded-full overflow-hidden border border-[var(--edge-hi)] hover:border-[rgba(var(--flame-rgb),.5)] transition-colors"
                aria-label="Contul tău"
                aria-expanded={userMenu}
              >
                {avatar}
              </button>
            ) : me === false ? (
              <button data-testid="header-login-button" onClick={() => setLoginOpen(true)} className="knob knob-sm hdr-desktop-only" aria-label="Intră în cont">
                <LogIn />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* meniu cont — poziționat fix, sub pilulă pe desktop / deasupra barei pe mobil */}
      {me && userMenu && (
        <div className="fixed right-3 top-16 max-md:top-auto max-md:bottom-[76px] z-[140] glass rounded-2xl w-56 p-2" data-testid="header-user-menu">
          <p className="px-3 py-2 text-xs text-[var(--text-2)] truncate" data-testid="header-user-email">{me.email}</p>
          {isAdmin && (
            <Link to="/admin" data-testid="header-admin-link" className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors">
              <ShieldCheck size={14} className="text-[var(--flame)]" /> Panou admin
            </Link>
          )}
          <button
            data-testid="header-settings-button"
            onClick={() => { setUserMenu(false); setSettingsOpen(true); }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
          >
            <Settings size={14} className="text-[var(--text-2)]" /> Setări
          </button>
          <button
            data-testid="header-logout-button"
            onClick={() => { setUserMenu(false); logout(); toast.info("Ai ieșit din cont."); }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
          >
            <LogOut size={14} className="text-[var(--live)]" /> Ieși din cont
          </button>
        </div>
      )}

      {/* navigație mobilă — bară jos: 3 icoane + avatar */}
      <nav className="mnav" aria-label="Navigație mobilă" data-testid="mobile-nav">
        {MTABS.map((t) => {
          const Icon = t.icon;
          const active = isActiveTab(t.to, location.pathname);
          return (
            <Link key={t.to} to={t.to} data-testid={`mtab-${t.tid}`} className={`relative ${active ? "active" : ""}`} aria-label={t.label} aria-current={active ? "page" : undefined}>
              <Icon size={17} />
              {t.dot && dots[t.dot] > 0 && <span className="tab-dot" style={{ top: 4, right: 10 }} aria-hidden="true" />}
            </Link>
          );
        })}
        {me ? (
          <button data-testid="mtab-cont" onClick={() => setUserMenu((o) => !o)} aria-label="Contul tău" className="mnav-btn overflow-hidden" aria-expanded={userMenu}>
            <span className="block w-[26px] h-[26px] rounded-full overflow-hidden">{avatar}</span>
          </button>
        ) : (
          <button data-testid="mtab-cont" onClick={() => setLoginOpen(true)} aria-label="Intră în cont" className="mnav-btn">
            <CircleUserRound size={17} />
          </button>
        )}
      </nav>

      {showBio && <LogoModal onClose={() => setShowBio(false)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {flash && <div className="lightning" data-testid="lightning-flash" />}
      {whisper && (
        <div className="fixed inset-0 z-[190] grid place-items-center pointer-events-none">
          <p className="whisper-text font-mono-x text-sm sm:text-lg uppercase text-[var(--text)]/90 tracking-[0.5em]" data-testid="whisper-text">
            No risks, no hits.
          </p>
        </div>
      )}
    </>
  );
}
