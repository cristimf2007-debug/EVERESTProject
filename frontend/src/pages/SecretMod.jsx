import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Users, Activity, ScrollText, LogOut, Search, Ban, MicOff, Mic, UserX, RefreshCw, CircleDot, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import api, { mediaUrl } from "@/lib/api";

const ACT_TYPES = [
  { k: "", label: "Toate" },
  { k: "login", label: "Logări" },
  { k: "register", label: "Conturi noi" },
  { k: "subscribe", label: "Abonări" },
  { k: "contact", label: "Contact" },
  { k: "moderation", label: "Moderare" },
];

const fmtTs = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

function Avatar({ picture, name }) {
  const [broken, setBroken] = useState(false);
  if (picture && !broken) {
    return <img src={mediaUrl(picture)} alt={name} referrerPolicy="no-referrer" onError={() => setBroken(true)} className="w-9 h-9 rounded-full object-cover ring-1 ring-[var(--edge-hi)]" />;
  }
  return (
    <span className="grid w-9 h-9 rounded-full place-items-center text-xs font-black text-[#07090e]" style={{ background: "linear-gradient(180deg, var(--accent-hi), var(--flame))" }}>
      {(name || "?")[0].toUpperCase()}
    </span>
  );
}

// Panoul secret de moderare — se randează DOAR după autentificarea adminului (cookie/JWT)
export default function SecretMod() {
  const [authed, setAuthed] = useState(null); // null = verificare, false = nelogat
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("users");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [activity, setActivity] = useState([]);
  const [actType, setActType] = useState("");
  const [query, setQuery] = useState("");
  const [loadingAct, setLoadingAct] = useState(false);

  const loadOverview = useCallback(() => {
    api.get("/admin/panel/overview").then((r) => setOverview(r.data)).catch(() => {});
  }, []);
  const loadUsers = useCallback(() => {
    api.get("/admin/panel/users").then((r) => setUsers(r.data)).catch(() => toast.error("Nu am putut încărca utilizatorii."));
  }, []);
  const loadActivity = useCallback((type = actType, q = query) => {
    setLoadingAct(true);
    api.get("/admin/panel/activity", { params: { type, q, limit: 300 } })
      .then((r) => setActivity(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingAct(false));
  }, [actType, query]);

  useEffect(() => {
    api.get("/auth/me")
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadOverview();
    loadUsers();
    loadActivity("", "");
    const t = setInterval(loadOverview, 15000); // „live" — se reîmprospătează singur
    return () => clearInterval(t);
  }, [authed, loadOverview, loadUsers, loadActivity]);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/login", { email, password });
      setAuthed(true);
      toast.success("Bine ai venit în panoul de control.");
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Autentificare eșuată.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setAuthed(false);
  };

  const moderate = async (action, u) => {
    try {
      await api.post("/admin/panel/moderate", { action, user_id: u.user_id || "", name: u.name || "", email: u.email || "" });
      const labels = { kick: "Sesiune închisă", ban: "Utilizator banat", unban: "Ban ridicat", mute: "Utilizator mutat", unmute: "Mute ridicat" };
      toast.success(`${labels[action]}: ${u.name || u.email}`);
      loadUsers();
      loadActivity();
      loadOverview();
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Acțiunea a eșuat.");
    }
  };

  // ------- poarta de autentificare: nimic din panou nu se randează fără admin -------
  if (authed === null) {
    return <div className="min-h-[70vh] grid place-items-center"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-3)] animate-pulse">Se verifică…</p></div>;
  }
  if (!authed) {
    return (
      <div className="min-h-[80vh] grid place-items-center px-4" data-testid="mod-login">
        <form onSubmit={login} className="ob-card p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><ShieldCheck size={18} /></span>
            <div>
              <h1 className="font-display text-lg uppercase">Zonă restricționată</h1>
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">Doar pentru administrator</p>
            </div>
          </div>
          <input data-testid="mod-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email admin" className="input-recessed w-full rounded-xl px-4 py-3 text-sm outline-none mb-3" />
          <input data-testid="mod-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă" className="input-recessed w-full rounded-xl px-4 py-3 text-sm outline-none" />
          <button data-testid="mod-login-button" disabled={busy} className="btn-flame w-full !h-11 !text-[11px] mt-5 disabled:opacity-50">
            {busy ? "Se verifică…" : "Intră"}
          </button>
        </form>
      </div>
    );
  }

  const cards = overview ? [
    { label: "Fani înregistrați", val: overview.fans, tid: "ov-fans" },
    { label: "Abonați canal", val: overview.subscribers, tid: "ov-subs" },
    { label: "Online pe chat", val: overview.online_chat, tid: "ov-online", live: true },
    { label: "Logări azi", val: overview.logins_today, tid: "ov-logins" },
    { label: "Mesaje chat", val: overview.messages_total, tid: "ov-msgs" },
    { label: "Piese / Clipuri", val: `${overview.tracks} / ${overview.videos}`, tid: "ov-media" },
    { label: "Mesaje contact", val: overview.contacts, tid: "ov-contacts" },
  ] : [];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8" data-testid="secret-mod-panel">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="badge-engraved">Acces exclusiv · sesiune securizată</p>
          <h1 className="font-display text-3xl uppercase mt-2">Panou <span className="text-[var(--flame)]">Control</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="knob" onClick={() => { loadOverview(); loadUsers(); loadActivity(); }} aria-label="Reîmprospătează" data-testid="mod-refresh"><RefreshCw size={15} /></button>
          <button className="btn-steel !h-10 !px-4 !text-[10px]" onClick={logout} data-testid="mod-logout"><LogOut size={13} /> Ieși</button>
        </div>
      </header>

      {/* statistici live */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8" data-testid="mod-overview">
        {cards.map((c) => (
          <div key={c.tid} className="ob-card p-4" data-testid={c.tid}>
            <p className="text-[9px] font-mono-x uppercase tracking-[0.14em] text-[var(--text-3)] flex items-center gap-1.5">
              {c.live && <CircleDot size={9} className="text-[var(--live)]" />} {c.label}
            </p>
            <p className="stat-num !text-2xl mt-2">{c.val}</p>
          </div>
        ))}
      </div>

      {/* taburi */}
      <div className="seg-control mb-6" data-testid="mod-tabs">
        {[["users", "Utilizatori", Users], ["activity", "Activitate", Activity], ["logs", "Loguri", ScrollText]].map(([k, label, Icon]) => (
          <button key={k} className={`seg-link ${tab === k ? "active" : ""}`} onClick={() => setTab(k)} data-testid={`mod-tab-${k}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* UTILIZATORI: fani + abonați, cu moderare one-click */}
      {tab === "users" && (
        <div data-testid="mod-users">
          {!users ? (
            <p className="text-[var(--text-3)] text-sm font-mono-x uppercase tracking-widest animate-pulse">Se încarcă…</p>
          ) : (
            <>
              <div className="space-y-2.5">
                {users.fans.length === 0 && <p className="text-[var(--text-3)] text-sm">Niciun fan înregistrat încă.</p>}
                {users.fans.map((u) => (
                  <div key={u.user_id || u.email} className="ob-card !rounded-2xl p-3.5 flex flex-wrap items-center gap-3" data-testid={`mod-user-${u.email}`}>
                    <Avatar picture={u.picture} name={u.name || u.email} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold flex items-center gap-2 truncate">
                        {u.name || "—"}
                        {u.online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Online pe chat" />}
                        {u.banned && <span className="hdr-badge" style={{ color: "var(--live)", border: "1px solid rgba(var(--live-rgb),.5)" }}>BANAT</span>}
                        {u.muted && <span className="hdr-badge" style={{ color: "var(--accent-hi)", border: "1px solid var(--edge-hi)" }}>MUTAT</span>}
                      </p>
                      <p className="text-[11px] text-[var(--text-2)] truncate flex items-center gap-1.5"><Mail size={10} /> {u.email}</p>
                      <p className="text-[10px] font-mono-x text-[var(--text-3)] mt-0.5 flex items-center gap-1.5">
                        <Clock size={9} /> ultima activitate: {fmtTs(u.last_seen)} · membru din {fmtTs(u.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="knob knob-sm" title="Kick — închide sesiunea acum" aria-label={`Kick ${u.name}`} data-testid={`mod-kick-${u.email}`} onClick={() => moderate("kick", u)}><UserX size={13} /></button>
                      <button className="knob knob-sm" title={u.muted ? "Scoate mute" : "Mute pe chat"} aria-label={`Mute ${u.name}`} data-testid={`mod-mute-${u.email}`} onClick={() => moderate(u.muted ? "unmute" : "mute", u)}>
                        {u.muted ? <Mic size={13} /> : <MicOff size={13} />}
                      </button>
                      <button className={`knob knob-sm ${u.banned ? "!border-[rgba(var(--live-rgb),.6)] !text-[var(--live)]" : ""}`} title={u.banned ? "Ridică banul" : "Ban cont + chat"} aria-label={`Ban ${u.name}`} data-testid={`mod-ban-${u.email}`} onClick={() => moderate(u.banned ? "unban" : "ban", u)}><Ban size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="badge-engraved mt-10 mb-4">Abonați la canal ({users.subscribers.length})</h2>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {users.subscribers.map((s, i) => (
                  <div key={s.sid || i} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3" data-testid={`mod-sub-${i}`}>
                    <span className="text-xs truncate">{s.email || `Dispozitiv ${String(s.sid || "").slice(0, 8)}…`}</span>
                    <span className="text-[10px] font-mono-x text-[var(--text-3)] shrink-0">{fmtTs(s.subscribed_at)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ACTIVITATE + LOGURI: același jurnal, cu filtre și căutare */}
      {(tab === "activity" || tab === "logs") && (
        <div data-testid="mod-activity">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {tab === "logs" && ACT_TYPES.map((t) => (
              <button key={t.k} className={`seg-link !py-2 ${actType === t.k ? "active" : ""}`} data-testid={`mod-filter-${t.k || "all"}`}
                onClick={() => { setActType(t.k); loadActivity(t.k, query); }}>
                {t.label}
              </button>
            ))}
            {tab === "activity" && (
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">Cine a intrat și când — logări, conturi noi, abonări</p>
            )}
            <form className="relative ml-auto" onSubmit={(e) => { e.preventDefault(); loadActivity(tab === "activity" ? "" : actType, query); }}>
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input
                data-testid="mod-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Caută nume, detaliu, IP…"
                className="input-recessed !rounded-full pl-9 pr-4 py-2.5 text-xs outline-none w-56"
              />
            </form>
          </div>

          <div className="space-y-1.5">
            {loadingAct && <p className="text-[var(--text-3)] text-xs font-mono-x uppercase tracking-widest animate-pulse py-4">Se încarcă jurnalul…</p>}
            {!loadingAct && activity.length === 0 && <p className="text-[var(--text-3)] text-sm py-4">Nicio intrare în jurnal.</p>}
            {!loadingAct && activity
              .filter((e) => tab === "logs" || ["login", "register", "subscribe"].includes(e.type))
              .map((e) => (
                <div key={e.id} className="glass rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-testid={`mod-log-${e.id}`}>
                  <span className={`hdr-badge shrink-0 ${
                    e.type === "login" ? "vip" :
                    e.type === "moderation" ? "" : "fan"
                  }`} style={e.type === "moderation" ? { color: "var(--live)", border: "1px solid rgba(var(--live-rgb),.5)" } : {}}>
                    {e.type}
                  </span>
                  <span className="text-xs font-semibold min-w-0 truncate">{e.actor}</span>
                  <span className="text-[11px] text-[var(--text-2)] flex-1 min-w-0 truncate">{e.detail}</span>
                  <span className="text-[10px] font-mono-x text-[var(--text-3)] shrink-0">{e.ip}</span>
                  <span className="text-[10px] font-mono-x text-[var(--text-3)] shrink-0" data-testid={`mod-log-ts-${e.id}`}>{fmtTs(e.ts)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
