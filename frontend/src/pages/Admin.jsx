import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, Trash2, SkipForward, LogOut, Music2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import api, { mediaUrl, formatApiError } from "@/lib/api";

export default function Admin() {
  const [me, setMe] = useState(null); // null = verificare, false = nelogat
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [tracks, setTracks] = useState([]);
  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const loadTracks = () => api.get("/tracks").then((r) => setTracks(r.data || [])).catch(() => {});

  useEffect(() => {
    api.get("/auth/me")
      .then((r) => { setMe(r.data); loadTracks(); })
      .catch(() => setMe(false));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("bioxic_token", r.data.token);
      setMe(r.data.user);
      loadTracks();
      toast.success("Salut, boss!");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("bioxic_token");
    setMe(false);
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Scrie titlul piesei.");
    if (!audioFile) return toast.error("Alege fișierul audio (MP3/WAV).");
    const fd = new FormData();
    fd.append("title", title.trim());
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
    if (!window.confirm(`Ștergi „${t.title}" definitiv?`)) return;
    try {
      await api.delete(`/admin/tracks/${t.id}`);
      toast.success("Piesă ștearsă.");
      loadTracks();
    } catch (err) {
      toast.error(formatApiError(err));
    }
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
          <div key={t.id} className="glass rounded-xl px-4 py-3 flex items-center gap-4">
            <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{t.title}</p>
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--muted)]">{t.plays || 0} redări</p>
            </div>
            <button onClick={() => del(t)} className="btn-ghost rounded-full w-9 h-9 grid place-items-center hover:!text-[var(--live)]" aria-label={`Șterge ${t.title}`} data-testid={`admin-track-delete-${t.id}`}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {tracks.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-6 text-center">Nicio piesă încă — urcă prima piesă mai sus.</p>
        )}
      </div>
    </div>
  );
}
