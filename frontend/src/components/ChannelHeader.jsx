import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { toast } from "sonner";
import api, { getSid } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import { useFan } from "@/context/FanContext";
import LoginModal from "@/components/LoginModal";
import AccountPanel from "@/components/AccountPanel";
import ProfileEditor from "@/components/ProfileEditor";
import NotificationBell from "@/components/NotificationBell";
import SearchOverlay from "@/components/SearchOverlay";
import SettingsModal from "@/components/SettingsModal";

const TABS = [
  { to: "/", label: "Acasă", tid: "acasa", dot: null },
  { to: "/despre", label: "Despre", tid: "despre", dot: null },
  { to: "/everest-manele", label: "Everest Manele", tid: "everest", dot: null },
  { to: "/sample-pack", label: "Sample Pack", tid: "sample-pack", dot: null, wide: true },
  { to: "/muzica", label: "Muzică", tid: "muzica", dot: "muzica" },
  { to: "/radio", label: "Radio", tid: "radio", dot: null },
  { to: "/tv", label: "TV", tid: "tv", dot: null },
  { to: "/contact", label: "Contact", tid: "contact", dot: null },
];


const isActiveTab = (to, pathname) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

// Header extins — bară de comandă centrată: logo · nav · căutare · clopoțel · abonare
export default function ChannelHeader() {
  const location = useLocation();
  const { listeners } = useRadio();
  const { me, setMe, loginOpen, setLoginOpen, logout } = useFan();
  const [subs, setSubs] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [subEmailOpen, setSubEmailOpen] = useState(false);
  const [subEmail, setSubEmail] = useState(() => localStorage.getItem("bioxic_sub_email") || "");
  const [logoPressed, setLogoPressed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = React.useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") { setMobileOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dots, setDots] = useState({ muzica: 0, video: 0 });

  const onLogoTouch = async () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-noflash");
    if (!reduced) {
      setLogoPressed(true);
      window.setTimeout(() => setLogoPressed(false), 300);
    }
    if (me && typeof me === "object") {
      setAccountOpen(true);
      return;
    }
    if (me === false) {
      setLoginOpen(true);
      return;
    }
    try {
      const { data } = await api.get("/fans/me");
      if (data?.user_id) {
        setMe(data);
        setAccountOpen(true);
      } else {
        setMe(false);
        setLoginOpen(true);
      }
    } catch {
      setLoginOpen(true);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setSubEmailOpen(false); setMobileOpen(false); }, [location.pathname]);

  // puncte cyan pe taburile cu noutăți + deschiderea Setărilor din footer
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
    api.get("/auth/me").then((r) => setIsAdmin(!!r.data?.email)).catch(() => {});
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

  return (
    <>
      <header data-testid="channel-header" className="site-header">
        {/* bara full-width: linkuri stânga · logo centrat · linkuri + acțiuni dreapta */}
        <div className={`hdr-bar pointer-events-auto ${scrolled ? "scrolled" : ""}`}>
          <a href="#main-content" className="skip-link">Sari la conținut</a>
          <div className="header-leading">
            <button ref={menuButton} className="knob mobile-menu-toggle" aria-label={mobileOpen ? "Închide meniul" : "Deschide meniul"} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X /> : <Menu />}</button>
            <button className="knob header-search-button" data-testid="search-field" onClick={() => setSearchOpen(true)} aria-label="Caută pe site"><Search /></button>
            <span className="header-edition">Artist. Producător. Independent.</span>
          </div>

          {/* logo oficial centrat (atinge-l — „Cine sunt eu") */}
          <button type="button" onClick={onLogoTouch} data-testid="channel-logo" aria-label={me && typeof me === "object" ? "Deschide profilul și contul" : "Intră în cont BIOXIC"} aria-haspopup="dialog" aria-expanded={accountOpen || loginOpen} className={`hdr-logo hdr-logo-center ${logoPressed ? "account-logo-pressed" : ""}`}>
            <img src="/logo.png" alt="BIOXIC" />
          </button>

          <div className="header-actions">

            <Link to="/muzica" className="hdr-live" data-testid="header-live-pill" aria-label="Deschide pagina radioului">
              <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--live)" }} />
              LIVE{listeners > 0 ? ` · ${listeners}` : ""}
            </Link>
            {/* căutare: câmp pe ecrane mari, knob pe restul */}


            <NotificationBell />
            <div className="relative">
              <button
                data-testid="channel-subscribe-button"
                onClick={toggleSub}
                className={subscribed ? "btn-steel !h-9 !px-4 !text-[10px]" : "btn-flame !h-9 !px-4 !text-[10px]"}
              >
                {subscribed ? "Abonat" : "Abonează-te"}
              </button>
              <AnimatePresence>
                {subEmailOpen && !subscribed && (
                <motion.form
                  initial={{ opacity: 0, y: -7, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.985 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  onSubmit={confirmGuestSub}
                  className="absolute right-0 top-12 z-50 glass rounded-2xl p-3 w-64 origin-top-right"
                  data-testid="subscribe-email-popover"
                >
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
                </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <nav id="primary-navigation" className={`site-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Navigație principală">
          {TABS.map((t) => {
            const active = isActiveTab(t.to, location.pathname);
            return (
              <Link key={t.to} to={t.to} data-testid={`tab-${t.tid}`} aria-current={active ? "page" : undefined} className={`hdr-link ${active ? "active" : ""}`}>
                {active && <motion.span layoutId="active-nav-indicator" className="nav-indicator" transition={{ type: "spring", stiffness: 420, damping: 36 }} aria-hidden="true" />}
                <span className="nav-label">{t.label}{t.dot && dots[t.dot] > 0 && <span className="tab-dot" />}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* navigație mobilă — bară jos: 4 icoane + avatar */}

      {accountOpen && me && <AccountPanel me={me} isAdmin={isAdmin} onClose={() => setAccountOpen(false)}
        onEditProfile={() => { setAccountOpen(false); setProfileEditorOpen(true); }}
        onOpenAccessibility={() => { setAccountOpen(false); setSettingsOpen(true); }}
        onLogout={async () => {
          try { await logout(); setAccountOpen(false); toast.info("Ai ieșit din cont."); }
          catch { toast.error("Nu am putut închide sesiunea. Încearcă din nou."); }
        }} />}
      {profileEditorOpen && me && <ProfileEditor me={me} onClose={() => setProfileEditorOpen(false)} onSaved={(updated) => setMe(updated)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
