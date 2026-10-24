import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, Trash2, SkipForward, LogOut, Music2, Image as ImageIcon, Ban, RefreshCw, Mic2, Tv, Plus } from "lucide-react";
import { toast } from "sonner";
import api, { mediaUrl, formatApiError } from "@/lib/api";

export default function Admin() {
  const [me, setMe] = useState(null); // null = verificare, false = nelogat
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [tracks, setTracks] = useState([]);
  const [title, setTitle] = useState("");
  const [playlist, setPlaylist] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [confirmId, setConfirmId] = useState(null); // "del-track-<id>" | "del-msg-<id>" | "ban-<id>" | "del-review-<id>"
  const [lyricsFor, setLyricsFor] = useState(null); // id-ul piesei cu editorul de versuri deschis
  const [lyricsText, setLyricsText] = useState("");
  const [tvProg, setTvProg] = useState([]);
  const [tvTime, setTvTime] = useState("");
  const [tvTitle, setTvTitle] = useState("");
  const [tvNote, setTvNote] = useState("");
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const loadTracks = () => api.get("/tracks").then((r) => setTracks(r.data || [])).catch(() => {});
  const loadChat = () => api.get("/admin/chat").then((r) => setChatMsgs(r.data || [])).catch(() => {});
  const loadContacts = () => api.get("/admin/contacts").then((r) => setContacts(r.data || [])).catch(() => {});
  const loadReviews = () => api.get("/reviews").then((r) => setReviews(r.data || [])).catch(() => {});
  const loadTv = () => api.get("/tv/schedule").then((r) => setTvProg(r.data || [])).catch(() => {});

  useEffect(() => {
    api.get("/auth/me")
      .then((r) => { setMe(r.data); loadTracks(); loadChat(); loadContacts(); loadReviews(); loadTv(); })
      .catch(() => setMe(false));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post("/auth/login", { email, password });
      setMe(r.data.user);
      loadTracks();
      loadChat();
      loadContacts();
      loadReviews();
      loadTv();
      toast.success("Salut, boss!");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setMe(false);
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Scrie titlul piesei.");
    if (!audioFile) return toast.error("Alege fișierul audio (MP3/WAV).");
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("playlist", playlist.trim());
    fd.append("audio", audioFile);
    if (coverFile) fd.append("cover", coverFile);
    setUploading(true);
    setProgress(0);
    try {
      await api.post("/admin/tracks", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => setProgress(ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0),
      });
      toast.success("Piesa a intrat în rotația radioului 24/7!", { description: title });
      setTitle("");
      setPlaylist("");
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview("");
      if (audioInputRef.current) audioInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";
      loadTracks();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const del = async (t) => {
    if (confirmId !== `del-track-${t.id}`) {
      setConfirmId(`del-track-${t.id}`);
      setTimeout(() => setConfirmId((c) => (c === `del-track-${t.id}` ? null : c)), 3500);
      return;
    }
    setConfirmId(null);
    try {
      await api.delete(`/admin/tracks/${t.id}`);
      toast.success("Piesă ștearsă.");
      loadTracks();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const delMsg = async (m) => {
    if (confirmId !== `del-msg-${m.id}`) {
      setConfirmId(`del-msg-${m.id}`);
      setTimeout(() => setConfirmId((c) => (c === `del-msg-${m.id}` ? null : c)), 3500);
      return;
    }
    setConfirmId(null);
    try {
      await api.delete(`/admin/chat/${m.id}`);
      setChatMsgs((ms) => ms.filter((x) => x.id !== m.id));
      toast.success("Mesaj șters.");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const banName = async (m) => {
    if (confirmId !== `ban-${m.id}`) {
      setConfirmId(`ban-${m.id}`);
      setTimeout(() => setConfirmId((c) => (c === `ban-${m.id}` ? null : c)), 3500);
      return;
    }
    setConfirmId(null);
    try {
      await api.post("/admin/chat/ban", { name: m.name });
      setChatMsgs((ms) => ms.filter((x) => x.name.toLowerCase() !== m.name.toLowerCase()));
      toast.success(`„${m.name}" a fost blocat pe chat.`);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const delReview = async (rv) => {
    if (confirmId !== `del-review-${rv.id}`) {
      setConfirmId(`del-review-${rv.id}`);
      setTimeout(() => setConfirmId((c) => (c === `del-review-${rv.id}` ? null : c)), 3500);
      return;
    }
    setConfirmId(null);
    try {
      await api.delete(`/admin/reviews/${rv.id}`);
      setReviews((rs) => rs.filter((x) => x.id !== rv.id));
      toast.success("Părere ștearsă.");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const setTrackPlaylist = async (t, pl) => {
    try {
      await api.patch(`/admin/tracks/${t.id}`, { playlist: pl });
      setTracks((ts) => ts.map((x) => (x.id === t.id ? { ...x, playlist: pl } : x)));
      toast.success(pl ? `„${t.title}" mutată în playlistul „${pl}".` : `„${t.title}" scoasă din playlist.`);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  // versuri: salvare per piesă — butonul de lyrics apare automat pe site când piesa are text
  const saveLyrics = async (t) => {
    try {
      await api.patch(`/admin/tracks/${t.id}`, { lyrics: lyricsText });
      setTracks((ts) => ts.map((x) => (x.id === t.id ? { ...x, lyrics: lyricsText } : x)));
      setLyricsFor(null);
      toast.success(lyricsText.trim() ? `Versuri salvate pentru „${t.title}" — apar acum în player.` : `Versuri șterse la „${t.title}".`);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  // program TV
  const addTv = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/tv/schedule", { time: tvTime, title: tvTitle, note: tvNote });
      setTvTime(""); setTvTitle(""); setTvNote("");
      loadTv();
      toast.success("Emisiune adăugată în programul TV.");
    } catch (err) { toast.error(formatApiError(err)); }
  };
  const delTv = async (id) => {
    try {
      await api.delete(`/admin/tv/schedule/${id}`);
      setTvProg((p) => p.filter((x) => x.id !== id));
      toast.info("Emisiune ștearsă din program.");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const skip = async () => {
    try {
      const r = await api.post("/admin/radio/skip");
      toast.success(`Radioul a sărit la: ${r.data.track}`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (me === null) {
    return <div className="min-h-screen grid place-items-center" data-testid="admin-loading"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--muted)] animate-pulse">Se încarcă…</p></div>;
  }

  if (me === false) {
    return (
      <div className="min-h-screen grid place-items-center px-4" data-testid="admin-login">
        <form onSubmit={login} className="glass rounded-2xl p-8 w-full max-w-sm">
          <img src="/logo-alt.png" alt="BIOXIC" className="w-14 h-14 rounded-full mx-auto border border-[var(--cyan)]" />
          <h1 className="font-display text-2xl font-black uppercase text-center mt-4">Admin BIOXIC</h1>
          <p className="text-xs text-[var(--muted)] text-center mt-1 mb-6">Doar upload de muzică. Atât.</p>
          <input
            data-testid="admin-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl bg-[var(--bg2)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--border-hi)] transition-colors"
          />
          <input
            data-testid="admin-password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolă"
            className="w-full rounded-xl bg-[var(--bg2)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--border-hi)] transition-colors mt-3"
          />
          <button data-testid="admin-login-button" disabled={busy} className="btn-cyan w-full rounded-xl py-3 text-sm font-black uppercase tracking-widest mt-5 disabled:opacity-50">
            {busy ? "Se verifică…" : "Intră"}
          </button>
          <Link to="/" className="block text-center text-[11px] font-mono-x uppercase tracking-widest text-[var(--faint)] hover:text-white transition-colors mt-5" data-testid="admin-back-home">
            ← Înapoi la site
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div data-testid="admin-panel" className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight">Upload muzică</h1>
          <p className="text-xs font-mono-x uppercase tracking-widest text-[var(--muted)] mt-1">{me.email} · radioul preia automat fiecare piesă nouă</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest" data-testid="admin-view-site">Vezi site-ul</Link>
          <button onClick={logout} className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" data-testid="admin-logout-button">
            <LogOut size={13} /> Ieși
          </button>
        </div>
      </div>

      {/* formular upload */}
      <form onSubmit={upload} className="glass rounded-2xl p-6 sm:p-8 mt-8" data-testid="admin-upload-form">
        <input
          data-testid="admin-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titlul piesei (ex: Ce bunaciune #02)"
          className="w-full rounded-xl bg-[var(--bg2)] border border-[var(--border)] px-4 py-3.5 text-sm outline-none focus:border-[var(--border-hi)] transition-colors"
        />
        <input
          data-testid="admin-playlist-input"
          value={playlist}
          onChange={(e) => setPlaylist(e.target.value)}
          placeholder="Playlist (opțional — ex: Seif Exclusives, Club Remixes)"
          className="w-full rounded-xl bg-[var(--bg2)] border border-[var(--border)] px-4 py-3.5 text-sm outline-none focus:border-[var(--border-hi)] transition-colors mt-3"
        />

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <label className="btn-ghost rounded-xl p-5 flex items-center gap-3 cursor-pointer text-sm" data-testid="admin-audio-drop">
            <Music2 size={20} className="text-[var(--cyan)] shrink-0" />
            <span className="min-w-0 truncate">{audioFile ? audioFile.name : "Alege audio (MP3 / WAV)"}</span>
            <input
              ref={audioInputRef}
              data-testid="admin-audio-input"
              type="file"
              accept=".mp3,.wav,.ogg,.m4a"
              className="hidden"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="btn-ghost rounded-xl p-5 flex items-center gap-3 cursor-pointer text-sm" data-testid="admin-cover-drop">
            {coverPreview ? (
              <img src={coverPreview} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            ) : (
              <ImageIcon size={20} className="text-[var(--amber)] shrink-0" />
            )}
            <span className="min-w-0 truncate">{coverFile ? coverFile.name : "Cover (opțional)"}</span>
            <input
              ref={coverInputRef}
              data-testid="admin-cover-input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setCoverFile(f);
                setCoverPreview(f ? URL.createObjectURL(f) : "");
              }}
            />
          </label>
        </div>

        {uploading && (
          <div className="mt-5" data-testid="admin-upload-progress">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${progress}%`, background: "var(--cyan)" }} />
            </div>
            <p className="text-[11px] font-mono-x text-[var(--muted)] mt-2 uppercase tracking-widest">Se încarcă… {progress}%</p>
          </div>
        )}

        <button
          data-testid="admin-upload-button"
          disabled={uploading}
          className="btn-cyan w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-widest mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UploadCloud size={17} /> {uploading ? "Se încarcă…" : "Urcă piesa în radio"}
        </button>
      </form>

      {/* control radio */}
      <div className="glass rounded-2xl p-5 mt-6 flex flex-wrap items-center justify-between gap-3" data-testid="admin-radio-control">
        <p className="text-sm text-[var(--muted)]">Radioul cântă piesele în ordinea urcării, la infinit.</p>
        <button onClick={skip} className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" data-testid="admin-skip-button">
          <SkipForward size={13} /> Sari la piesa următoare
        </button>
      </div>

      {/* lista pieselor */}
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight mt-10">Piese urcate ({tracks.length})</h2>
      <div className="grid gap-2 mt-5" data-testid="admin-track-list">
        {tracks.map((t) => (
          <div key={t.id} className="glass rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
            <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{t.title}</p>
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--muted)]">{t.plays || 0} redări</p>
            </div>
            <input
              data-testid={`admin-track-playlist-${t.id}`}
              defaultValue={t.playlist || ""}
              placeholder="Playlist…"
              onBlur={(e) => { if (e.target.value.trim() !== (t.playlist || "")) setTrackPlaylist(t, e.target.value.trim()); }}
              className="w-36 rounded-lg bg-[var(--bg2)] border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--border-hi)] transition-colors"
            />
            <button
              onClick={() => { setLyricsFor(lyricsFor === t.id ? null : t.id); setLyricsText(t.lyrics || ""); }}
              className={`btn-ghost rounded-full h-9 px-3 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${t.lyrics ? "!text-[var(--accent)]" : ""}`}
              aria-label={`Versuri ${t.title}`}
              data-testid={`admin-track-lyrics-${t.id}`}
            >
              <Mic2 size={13} /> Versuri{t.lyrics ? " ✓" : ""}
            </button>
            <button onClick={() => del(t)} className={`rounded-full h-9 grid place-items-center transition-colors ${confirmId === `del-track-${t.id}` ? "px-3 text-xs font-bold uppercase bg-[var(--live)] text-white" : "btn-ghost w-9 hover:!text-[var(--live)]"}`} aria-label={`Șterge ${t.title}`} data-testid={`admin-track-delete-${t.id}`}>
              {confirmId === `del-track-${t.id}` ? "Sigur?" : <Trash2 size={15} />}
            </button>
            {lyricsFor === t.id && (
              <div className="w-full flex flex-col sm:flex-row gap-2 mt-1">
                <textarea
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  rows={4}
                  placeholder="Lipește aici versurile piesei…"
                  className="flex-1 rounded-lg bg-[var(--bg2)] border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--border-hi)] transition-colors resize-y"
                  data-testid={`admin-lyrics-text-${t.id}`}
                />
                <button onClick={() => saveLyrics(t)} className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest shrink-0" data-testid={`admin-lyrics-save-${t.id}`}>
                  Salvează
                </button>
              </div>
            )}
          </div>
        ))}
        {tracks.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-6 text-center">Nicio piesă încă — urcă prima piesă mai sus.</p>
        )}
      </div>

      {/* program TV — apare pe pagina /tv, secțiunea „Programul de azi" */}
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight mt-12 flex items-center gap-2">
        <Tv size={18} /> Program TV ({tvProg.length})
      </h2>
      <form onSubmit={addTv} className="glass rounded-2xl p-5 mt-5 flex flex-wrap gap-3 items-center" data-testid="admin-tv-form">
        <input
          value={tvTime}
          onChange={(e) => setTvTime(e.target.value)}
          placeholder="21:00"
          required
          className="w-24 rounded-lg bg-[var(--bg2)] border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--border-hi)] transition-colors font-mono-x"
          data-testid="admin-tv-time"
        />
        <input
          value={tvTitle}
          onChange={(e) => setTvTitle(e.target.value)}
          placeholder="Titlul emisiunii / premierei…"
          required
          className="flex-1 min-w-[180px] rounded-lg bg-[var(--bg2)] border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--border-hi)] transition-colors"
          data-testid="admin-tv-title"
        />
        <input
          value={tvNote}
          onChange={(e) => setTvNote(e.target.value)}
          placeholder="Notă (opțional) — ex. premieră, invitat…"
          className="flex-1 min-w-[160px] rounded-lg bg-[var(--bg2)] border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--border-hi)] transition-colors"
          data-testid="admin-tv-note"
        />
        <button type="submit" className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" data-testid="admin-tv-add">
          <Plus size={13} /> Adaugă
        </button>
      </form>
      <div className="grid gap-2 mt-4" data-testid="admin-tv-list">
        {tvProg.map((s) => (
          <div key={s.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3" data-testid={`admin-tv-row-${s.id}`}>
            <span className="font-mono-x text-xs font-bold text-[var(--amber)]">{s.time}</span>
            <span className="text-sm flex-1 min-w-0 truncate">{s.title}{s.note ? <span className="text-[var(--muted)]"> · {s.note}</span> : ""}</span>
            <button onClick={() => delTv(s.id)} className="btn-ghost rounded-full w-9 h-9 grid place-items-center hover:!text-[var(--live)]" aria-label={`Șterge ${s.title}`} data-testid={`admin-tv-del-${s.id}`}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {tvProg.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-4 text-center">Nicio emisiune în program — adaugă prima mai sus.</p>
        )}
      </div>

      {/* moderare chat */}
      <div className="flex items-center justify-between mt-12">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">Moderare chat</h2>
        <button onClick={loadChat} className="btn-ghost rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" data-testid="admin-chat-refresh">
          <RefreshCw size={13} /> Reîmprospătează
        </button>
      </div>
      <div className="grid gap-2 mt-5" data-testid="admin-chat-list">
        {chatMsgs.map((m) => (
          <div key={m.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3" data-testid={`admin-chat-msg-${m.id}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate"><span className="font-semibold text-[var(--amber)]">{m.name}</span> <span className="text-[var(--muted)]">· {m.text}</span></p>
            </div>
            <button onClick={() => banName(m)} className={`rounded-full h-9 grid place-items-center transition-colors ${confirmId === `ban-${m.id}` ? "px-3 text-xs font-bold uppercase bg-[var(--amber)] text-black" : "btn-ghost w-9 hover:!text-[var(--amber)]"}`} aria-label={`Blochează ${m.name}`} data-testid={`admin-chat-ban-${m.id}`}>
              {confirmId === `ban-${m.id}` ? "Ban?" : <Ban size={14} />}
            </button>
            <button onClick={() => delMsg(m)} className={`rounded-full h-9 grid place-items-center transition-colors ${confirmId === `del-msg-${m.id}` ? "px-3 text-xs font-bold uppercase bg-[var(--live)] text-white" : "btn-ghost w-9 hover:!text-[var(--live)]"}`} aria-label={`Șterge mesajul`} data-testid={`admin-chat-delete-${m.id}`}>
              {confirmId === `del-msg-${m.id}` ? "Sigur?" : <Trash2 size={14} />}
            </button>
          </div>
        ))}
        {chatMsgs.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-6 text-center">Niciun mesaj pe chat momentan.</p>
        )}
      </div>

      {/* mesaje contact */}
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight mt-12">Mesaje contact ({contacts.length})</h2>
      <div className="grid gap-2 mt-5" data-testid="admin-contacts-list">
        {contacts.map((c) => (
          <div key={c.id} className="glass rounded-xl px-4 py-3.5" data-testid={`admin-contact-${c.id}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-bold">{c.name}</p>
              <a href={`mailto:${c.email}`} className="text-xs font-mono-x text-[var(--amber)] hover:underline">{c.email}</a>
              <span className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--faint)]">{c.subject}</span>
            </div>
            <p className="text-sm text-[var(--muted)] mt-2">{c.message}</p>
            <p className="text-[10px] font-mono-x text-[var(--faint)] mt-2">{new Date(c.created_at).toLocaleString("ro-RO")}</p>
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-6 text-center">Niciun mesaj de contact încă — formularul e pe pagina Despre.</p>
        )}
      </div>

      {/* moderare păreri */}
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight mt-12">Păreri fani ({reviews.length})</h2>
      <div className="grid gap-2 mt-5" data-testid="admin-reviews-list">
        {reviews.map((rv) => (
          <div key={rv.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3" data-testid={`admin-review-${rv.id}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm"><span className="font-semibold text-[var(--amber)]">{rv.name}</span> <span className="text-[var(--faint)] font-mono-x text-xs">· {rv.rating}/5</span></p>
              <p className="text-sm text-[var(--muted)] truncate mt-0.5">{rv.text}</p>
            </div>
            <button onClick={() => delReview(rv)} className={`rounded-full h-9 grid place-items-center transition-colors ${confirmId === `del-review-${rv.id}` ? "px-3 text-xs font-bold uppercase bg-[var(--live)] text-white" : "btn-ghost w-9 hover:!text-[var(--live)]"}`} aria-label="Șterge părerea" data-testid={`admin-review-delete-${rv.id}`}>
              {confirmId === `del-review-${rv.id}` ? "Sigur?" : <Trash2 size={14} />}
            </button>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-6 text-center">Nicio părere încă.</p>
        )}
      </div>
    </div>
  );
}
