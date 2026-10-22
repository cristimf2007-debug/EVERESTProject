import React, { useEffect, useState } from "react";
import { LogOut, Upload, Trash2, Radio, Plus, BarChart3, MessageSquare, Mail, Music, Ban, FileText, RefreshCw, ShieldCheck, Megaphone, Video as VideoIcon, Gamepad2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";

const inputCls = "w-full bg-black/40 border border-white/10 px-3 py-2.5 text-sm focus:border-[var(--accent)] outline-none";
const TABS = [
  { key: "tracks", label: "Piese", icon: Music },
  { key: "videos", label: "Video", icon: VideoIcon },
  { key: "announcements", label: "Anunțuri", icon: Megaphone },
  { key: "live", label: "Live", icon: Radio },
  { key: "moderation", label: "Moderare", icon: Ban },
  { key: "requests", label: "Cereri", icon: MessageSquare },
  { key: "messages", label: "Mesaje", icon: Mail },
  { key: "stats", label: "Statistici", icon: BarChart3 },
  { key: "content", label: "Conținut", icon: FileText },
  { key: "admins", label: "Admini", icon: ShieldCheck },
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("tracks");

  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false)).finally(() => setChecking(false));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("bioxic_token", r.data.token);
      setUser(r.data.user);
      toast.success("Autentificat ca admin");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("bioxic_token");
    setUser(false);
  };

  if (checking) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500" data-testid="admin-loading">Se verifică sesiunea...</div>;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6" data-testid="admin-login-page">
        <form onSubmit={login} className="glass rounded-sm p-8 w-full max-w-sm space-y-5">
          <h1 className="font-display font-black text-2xl uppercase tracking-tighter text-center">Admin <span className="text-[var(--accent)]">BIOXIC</span></h1>
          <input data-testid="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email admin" className={inputCls} />
          <input data-testid="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă" className={inputCls} />
          <button data-testid="admin-login-submit" className="w-full py-3 bg-[var(--accent)] text-black font-display font-bold text-sm tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors">Autentificare</button>
        </form>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="max-w-7xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tighter">Panou <span className="text-[var(--accent)]">Admin</span></h1>
        <button data-testid="admin-logout" onClick={logout} className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-red-400 transition-colors"><LogOut size={14} /> Ieșire</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-10" data-testid="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${tab === t.key ? "bg-[var(--accent)] text-black border-[var(--accent)] font-bold" : "border-white/15 text-zinc-400 hover:text-white"}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "tracks" && <TracksTab />}
      {tab === "videos" && <VideosTab />}
      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "live" && <LiveTab />}
      {tab === "moderation" && <ModerationTab />}
      {tab === "requests" && <RequestsTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "stats" && <StatsTab />}
      {tab === "content" && <ContentTab />}
      {tab === "admins" && <AdminsTab />}
    </div>
  );
}

function VideosTab() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: "", category: "muzica", description: "" });
  const [video, setVideo] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [uploading, setUploading] = useState(false);
  const load = () => api.get("/videos").then((r) => setVideos(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!video) { toast.error("Alege fișierul video"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("video", video);
      if (thumb) fd.append("thumb", thumb);
      await api.post("/admin/videos", fd);
      toast.success("Videoclip încărcat!");
      setForm({ title: "", category: "muzica", description: "" });
      setVideo(null); setThumb(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setUploading(false); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8" data-testid="admin-videos-tab">
      <form onSubmit={upload} className="glass rounded-sm p-6 space-y-4 h-fit">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2"><VideoIcon size={15} className="text-[var(--accent)]" /> Încarcă videoclip</h3>
        <input data-testid="video-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titlu videoclip" className={inputCls} />
        <select data-testid="video-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
          <option value="muzica">Muzică</option>
          <option value="gaming">Gaming</option>
        </select>
        <textarea data-testid="video-description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descriere (opțional)" className={inputCls} />
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Fișier video (MP4) *</label>
          <input data-testid="video-file" type="file" accept=".mp4,.webm,.mov" onChange={(e) => setVideo(e.target.files[0])} className="text-xs text-zinc-400 file:bg-[var(--accent)] file:text-black file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:mr-3" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Thumbnail (opțional)</label>
          <input data-testid="video-thumb" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setThumb(e.target.files[0])} className="text-xs text-zinc-400 file:bg-white/10 file:text-white file:border-0 file:px-3 file:py-1.5 file:text-xs file:uppercase file:mr-3" />
        </div>
        <button data-testid="video-upload-submit" disabled={uploading} className="w-full py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors disabled:opacity-50">
          {uploading ? "Se încarcă..." : "Publică videoclipul"}
        </button>
      </form>
      <div className="lg:col-span-2 space-y-3">
        {videos.map((v) => (
          <div key={v.id} data-testid={`admin-video-${v.id}`} className="glass rounded-sm p-4 flex items-center gap-4">
            <span className="text-[10px] px-2 py-1 bg-white/5 text-[var(--accent)] uppercase tracking-widest border border-white/10">{v.category}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{v.title}</p>
              <p className="text-[11px] text-zinc-500">{v.views} vizualizări</p>
            </div>
            <button data-testid={`admin-video-delete-${v.id}`} onClick={async () => { if (window.confirm("Ștergi videoclipul?")) { await api.delete(`/admin/videos/${v.id}`); load(); } }} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
        {videos.length === 0 && <p className="text-zinc-500 text-sm">Niciun videoclip încărcat.</p>}
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", text: "" });
  const load = () => api.get("/announcements").then((r) => setItems(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/announcements", form);
      toast.success("Anunț publicat!", { description: "A apărut pe prima pagină + notificare la fani." });
      setForm({ title: "", text: "" });
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8" data-testid="admin-announcements-tab">
      <form onSubmit={add} className="glass rounded-sm p-6 space-y-4 h-fit">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Megaphone size={15} className="text-[var(--accent)]" /> Anunț nou</h3>
        <p className="text-xs text-zinc-500">Apare pe prima pagină și trimite notificare + email la fani.</p>
        <input data-testid="announcement-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titlu anunț" className={inputCls} />
        <textarea data-testid="announcement-text" required rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Textul anunțului..." className={inputCls} />
        <button data-testid="announcement-submit" className="px-6 py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors">Publică anunțul</button>
      </form>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} data-testid={`admin-announcement-${a.id}`} className="glass rounded-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{a.text}</p>
                <p className="text-[10px] text-zinc-600 mt-2">{new Date(a.created_at).toLocaleString("ro-RO")}</p>
              </div>
              <button data-testid={`announcement-delete-${a.id}`} onClick={async () => { await api.delete(`/admin/announcements/${a.id}`); load(); }} className="p-1.5 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-zinc-500 text-sm">Niciun anunț publicat.</p>}
      </div>
    </div>
  );
}

function TracksTab() {
  const [tracks, setTracks] = useState([]);
  const [form, setForm] = useState({ title: "", genre: "remix", tags: "", lyrics: "", download_enabled: false, cover_url: "" });
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => api.get("/tracks").then((r) => setTracks(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!audio) { toast.error("Alege fișierul audio"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("genre", form.genre);
      fd.append("tags", form.tags);
      fd.append("lyrics", form.lyrics);
      fd.append("download_enabled", form.download_enabled);
      fd.append("cover_url", form.cover_url);
      fd.append("audio", audio);
      if (cover) fd.append("cover", cover);
      await api.post("/admin/tracks", fd);
      toast.success("Piesă încărcată!");
      setForm({ title: "", genre: "remix", tags: "", lyrics: "", download_enabled: false, cover_url: "" });
      setAudio(null); setCover(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setUploading(false); }
  };

  const toggleDownload = async (t) => {
    await api.patch(`/admin/tracks/${t.id}`, { download_enabled: !t.download_enabled }).catch(() => {});
    load();
  };

  const del = async (t) => {
    if (!window.confirm(`Ștergi „${t.title}"?`)) return;
    await api.delete(`/admin/tracks/${t.id}`).catch(() => {});
    toast.success("Piesă ștearsă");
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8" data-testid="admin-tracks-tab">
      <form onSubmit={upload} className="glass rounded-sm p-6 space-y-4 h-fit">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Upload size={15} className="text-[var(--accent)]" /> Încarcă piesă</h3>
        <input data-testid="upload-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titlu piesă" className={inputCls} />
        <select data-testid="upload-genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className={inputCls}>
          <option value="remix">Remix</option>
          <option value="ai">Manea Artificială (AI)</option>
          <option value="collab">Colaborare</option>
        </select>
        <input data-testid="upload-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tag-uri (separate prin virgulă)" className={inputCls} />
        <textarea data-testid="upload-lyrics" rows={3} value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} placeholder="Versuri (opțional)" className={inputCls} />
        <input data-testid="upload-cover-url" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="URL cover (sau încarcă fișier)" className={inputCls} />
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Fișier audio (MP3/WAV) *</label>
          <input data-testid="upload-audio" type="file" accept=".mp3,.wav,.ogg,.m4a" onChange={(e) => setAudio(e.target.files[0])} className="text-xs text-zinc-400 file:bg-[var(--accent)] file:text-black file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:mr-3" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Cover (opțional)</label>
          <input data-testid="upload-cover" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setCover(e.target.files[0])} className="text-xs text-zinc-400 file:bg-white/10 file:text-white file:border-0 file:px-3 file:py-1.5 file:text-xs file:uppercase file:mr-3" />
        </div>
        <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
          <input data-testid="upload-download-toggle" type="checkbox" checked={form.download_enabled} onChange={(e) => setForm({ ...form, download_enabled: e.target.checked })} className="accent-[var(--accent)] w-4 h-4" />
          Permite download
        </label>
        <button data-testid="upload-submit" disabled={uploading} className="w-full py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors disabled:opacity-50">
          {uploading ? "Se încarcă..." : "Publică piesa"}
        </button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        {tracks.map((t) => (
          <div key={t.id} data-testid={`admin-track-${t.id}`} className="glass rounded-sm p-4 flex items-center gap-4">
            <img src={t.cover_url?.startsWith("/api") ? `${window.location.origin.replace(/:\d+$/, "")}${t.cover_url}` : t.cover_url} alt="" className="w-12 h-12 object-cover rounded-sm border border-white/10"
              onError={(e) => { e.target.src = "/placeholder.svg"; }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{t.title}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{t.genre} · {t.plays} ascultări · {t.likes} like-uri</p>
            </div>
            <button data-testid={`admin-download-toggle-${t.id}`} onClick={() => toggleDownload(t)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest border transition-colors ${t.download_enabled ? "border-[var(--accent)] text-[var(--accent)]" : "border-white/15 text-zinc-500"}`}>
              DL {t.download_enabled ? "ON" : "OFF"}
            </button>
            <button data-testid={`admin-delete-track-${t.id}`} onClick={() => del(t)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors" aria-label="Șterge"><Trash2 size={16} /></button>
          </div>
        ))}
        {tracks.length === 0 && <p className="text-zinc-500 text-sm">Nicio piesă încă.</p>}
      </div>
    </div>
  );
}

function LiveTab() {
  const [status, setStatus] = useState({ is_live: false, youtube_video_id: "", title: "BIOXIC LIVE" });
  const [gaming, setGaming] = useState({ is_live: false, youtube_video_id: "", title: "BIOXIC Gaming" });
  const [schedule, setSchedule] = useState([]);
  const [newShow, setNewShow] = useState({ title: "", date: "" });

  const load = () => {
    api.get("/live/status").then((r) => setStatus(r.data)).catch(() => {});
    api.get("/gaming/status").then((r) => setGaming(r.data)).catch(() => {});
    api.get("/live/schedule").then((r) => setSchedule(r.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.post("/admin/live", { is_live: status.is_live, youtube_video_id: status.youtube_video_id, title: status.title });
      toast.success(status.is_live ? "Modul LIVE pornit! Fani primesc notificare." : "Modul LIVE oprit");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const saveGaming = async () => {
    try {
      await api.post("/admin/gaming", { is_live: gaming.is_live, youtube_video_id: gaming.youtube_video_id, title: gaming.title });
      toast.success(gaming.is_live ? "Gaming LIVE pornit!" : "Gaming oprit");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const addShow = async () => {
    if (!newShow.title || !newShow.date) { toast.error("Completează titlul și data"); return; }
    await api.post("/admin/live/schedule", { title: newShow.title, date: new Date(newShow.date).toISOString() }).catch((e) => toast.error(formatApiError(e)));
    setNewShow({ title: "", date: "" });
    load();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8" data-testid="admin-live-tab">
      <div className="glass rounded-sm p-6 space-y-4 h-fit">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Radio size={15} className="text-[var(--accent)]" /> Control LIVE</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" data-testid="admin-live-toggle" onClick={() => setStatus({ ...status, is_live: !status.is_live })}
            className={`w-14 h-7 relative transition-colors ${status.is_live ? "bg-[var(--accent)]" : "bg-white/10"}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white transition-all ${status.is_live ? "left-8" : "left-1"}`} />
          </button>
          <span className="text-sm">{status.is_live ? "LIVE PORNIT" : "Offline"}</span>
        </label>
        <input data-testid="admin-live-video-id" value={status.youtube_video_id || ""} onChange={(e) => setStatus({ ...status, youtube_video_id: e.target.value })}
          placeholder="ID video YouTube Live (opțional — altfel se folosește stream-ul canalului)" className={inputCls} />
        <input data-testid="admin-live-title" value={status.title || ""} onChange={(e) => setStatus({ ...status, title: e.target.value })} placeholder="Titlu live" className={inputCls} />
        <button data-testid="admin-live-save" onClick={save} className="px-6 py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors">Salvează</button>
      </div>
      <div className="glass rounded-sm p-6 space-y-4">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest">Program live-uri</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input data-testid="schedule-title" value={newShow.title} onChange={(e) => setNewShow({ ...newShow, title: e.target.value })} placeholder="Titlu live" className={inputCls} />
          <input data-testid="schedule-date" type="datetime-local" value={newShow.date} onChange={(e) => setNewShow({ ...newShow, date: e.target.value })} className={inputCls} />
          <button data-testid="schedule-add" onClick={addShow} className="px-4 py-2.5 border border-[var(--accent)] text-[var(--accent)] text-xs font-bold uppercase whitespace-nowrap hover:bg-[var(--accent)] hover:text-black transition-colors flex items-center gap-1"><Plus size={13} /> Adaugă</button>
        </div>
        <div className="space-y-2">
          {schedule.map((s) => (
            <div key={s.id} data-testid={`schedule-item-${s.id}`} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-sm">{s.title}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--accent)]">{new Date(s.date).toLocaleString("ro-RO")}</span>
                <button data-testid={`schedule-delete-${s.id}`} onClick={async () => { await api.delete(`/admin/live/schedule/${s.id}`); load(); }} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {schedule.length === 0 && <p className="text-zinc-500 text-sm">Niciun live programat.</p>}
        </div>
      </div>
      {/* GAMING */}
      <div className="glass rounded-sm p-6 space-y-4 lg:col-span-2">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Gamepad2 size={15} className="text-[var(--accent)]" /> Control GAMING LIVE</h3>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" data-testid="admin-gaming-toggle" onClick={() => setGaming({ ...gaming, is_live: !gaming.is_live })}
              className={`w-14 h-7 relative transition-colors ${gaming.is_live ? "bg-[var(--accent)]" : "bg-white/10"}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white transition-all ${gaming.is_live ? "left-8" : "left-1"}`} />
            </button>
            <span className="text-sm">{gaming.is_live ? "GAMING PORNIT" : "Offline"}</span>
          </label>
          <input data-testid="admin-gaming-video-id" value={gaming.youtube_video_id || ""} onChange={(e) => setGaming({ ...gaming, youtube_video_id: e.target.value })}
            placeholder="ID video YouTube (gaming)" className={`${inputCls} flex-1 min-w-[220px]`} />
          <button data-testid="admin-gaming-save" onClick={saveGaming} className="px-6 py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors">Salvează</button>
        </div>
      </div>
    </div>
  );
}

function ModerationTab() {
  const [chat, setChat] = useState([]);
  const [comments, setComments] = useState([]);
  const load = () => {
    api.get("/admin/chat").then((r) => setChat(r.data || [])).catch(() => {});
    api.get("/admin/comments").then((r) => setComments(r.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const ban = async (name) => {
    if (!window.confirm(`Blochezi „${name}" și ștergi mesajele lui?`)) return;
    await api.post("/admin/chat/ban", { name }).catch(() => {});
    toast.success(`${name} blocat`);
    load();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8" data-testid="admin-moderation-tab">
      <div className="glass rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest">Chat live</h3>
          <button data-testid="moderation-refresh" onClick={load} className="text-zinc-500 hover:text-[var(--accent)]"><RefreshCw size={14} /></button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {chat.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-2 text-sm border-b border-white/5 pb-2" data-testid={`mod-chat-${m.id}`}>
              <div className="min-w-0"><span className="text-[var(--accent)] text-xs font-semibold">{m.name}: </span><span className="text-zinc-300 break-words">{m.text}</span></div>
              <div className="flex gap-1 shrink-0">
                <button data-testid={`mod-ban-${m.id}`} onClick={() => ban(m.name)} className="p-1 text-zinc-500 hover:text-orange-400" title="Blochează"><Ban size={13} /></button>
                <button data-testid={`mod-del-${m.id}`} onClick={async () => { await api.delete(`/admin/chat/${m.id}`); load(); }} className="p-1 text-zinc-500 hover:text-red-400" title="Șterge"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {chat.length === 0 && <p className="text-zinc-500 text-sm">Niciun mesaj în chat.</p>}
        </div>
      </div>
      <div className="glass rounded-sm p-6">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Comentarii piese</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 text-sm border-b border-white/5 pb-2" data-testid={`mod-comment-${c.id}`}>
              <div className="min-w-0"><span className="text-[var(--accent)] text-xs font-semibold">{c.name}: </span><span className="text-zinc-300 break-words">{c.text}</span></div>
              <button data-testid={`mod-del-comment-${c.id}`} onClick={async () => { await api.delete(`/admin/comments/${c.id}`); load(); }} className="p-1 text-zinc-500 hover:text-red-400 shrink-0" title="Șterge"><Trash2 size={13} /></button>
            </div>
          ))}
          {comments.length === 0 && <p className="text-zinc-500 text-sm">Niciun comentariu.</p>}
        </div>
      </div>
    </div>
  );
}

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const load = () => api.get("/admin/requests").then((r) => setRequests(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <div className="glass rounded-sm p-6" data-testid="admin-requests-tab">
      <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Cereri de piese din live</h3>
      <div className="space-y-2">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-white/5 pb-2" data-testid={`request-${r.id}`}>
            <span className="text-sm"><span className="text-[var(--accent)]">{r.name}</span> cere: <span className="text-white">{r.song}</span></span>
            <button data-testid={`request-delete-${r.id}`} onClick={async () => { await api.delete(`/admin/requests/${r.id}`); load(); }} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
        {requests.length === 0 && <p className="text-zinc-500 text-sm">Nicio cerere încă.</p>}
      </div>
    </div>
  );
}

function MessagesTab() {
  const [msgs, setMsgs] = useState([]);
  useEffect(() => { api.get("/admin/contacts").then((r) => setMsgs(r.data || [])).catch(() => {}); }, []);
  return (
    <div className="space-y-3" data-testid="admin-messages-tab">
      {msgs.map((m) => (
        <div key={m.id} className="glass rounded-sm p-5" data-testid={`message-${m.id}`}>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-semibold text-sm">{m.name}</span>
            <span className="text-xs text-zinc-500">{m.email}</span>
            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] uppercase tracking-widest border border-[var(--accent)]/30">{m.subject}</span>
            <span className="text-[10px] text-zinc-600 ml-auto">{new Date(m.created_at).toLocaleString("ro-RO")}</span>
          </div>
          <p className="text-sm text-zinc-300">{m.message}</p>
        </div>
      ))}
      {msgs.length === 0 && <p className="text-zinc-500 text-sm">Niciun mesaj primit.</p>}
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);
  if (!stats) return <p className="text-zinc-500">Se încarcă...</p>;
  const cards = [
    ["Ascultări totale", stats.total_plays, "stats-plays"],
    ["Like-uri totale", stats.total_likes, "stats-likes"],
    ["Piese publicate", stats.total_tracks, "stats-tracks"],
    ["Vizitatori unici (sesiune)", stats.visitors, "stats-visitors"],
  ];
  return (
    <div data-testid="admin-stats-tab">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(([label, val, tid]) => (
          <div key={tid} className="glass rounded-sm p-6" data-testid={tid}>
            <p className="font-display font-bold text-3xl text-[var(--accent)]">{val}</p>
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mt-2">{label}</p>
          </div>
        ))}
      </div>
      <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Top piese</h3>
      <div className="space-y-2">
        {stats.top_tracks.map((t, i) => (
          <div key={t.id} className="glass rounded-sm p-4 flex items-center gap-4" data-testid={`top-track-${i}`}>
            <span className="font-display font-black text-[var(--accent)] text-lg w-8">#{i + 1}</span>
            <span className="flex-1 text-sm truncate">{t.title}</span>
            <span className="text-xs text-zinc-500">{t.plays} ascultări</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ email: "", password: "" });
  const load = () => api.get("/admin/admins").then((r) => setAdmins(r.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/admins", form);
      toast.success(`Admin adăugat: ${form.email}`, { description: "Poate urca piese și gestiona site-ul din /admin." });
      setForm({ email: "", password: "" });
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const del = async (email) => {
    if (!window.confirm(`Ștergi accesul de admin pentru ${email}?`)) return;
    try {
      await api.delete(`/admin/admins/${encodeURIComponent(email)}`);
      toast.success("Admin eliminat");
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8" data-testid="admin-admins-tab">
      <form onSubmit={add} className="glass rounded-sm p-6 space-y-4 h-fit">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={15} className="text-[var(--accent)]" /> Adaugă admin
        </h3>
        <p className="text-xs text-zinc-500">Va putea urca piese, porni live-uri și modera. Doar tu poți adăuga sau elimina admini.</p>
        <input data-testid="new-admin-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email admin nou" className={inputCls} />
        <input data-testid="new-admin-password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Parolă (min. 8 caractere)" className={inputCls} />
        <button data-testid="new-admin-submit" className="px-6 py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors">Adaugă admin</button>
      </form>
      <div className="glass rounded-sm p-6 h-fit">
        <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Admini activi</h3>
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.email} data-testid={`admin-row-${a.email}`} className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <p className="text-sm">{a.email}</p>
                <p className="text-[10px] text-zinc-600">{a.created_at ? new Date(a.created_at).toLocaleDateString("ro-RO") : "principal"}</p>
              </div>
              <button data-testid={`admin-delete-${a.email}`} onClick={() => del(a.email)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors" aria-label="Șterge admin"><Trash2 size={14} /></button>
            </div>
          ))}
          {admins.length === 0 && <p className="text-zinc-500 text-sm">Doar contul principal.</p>}
        </div>
      </div>
    </div>
  );
}

function ContentTab() {
  const [content, setContent] = useState({});
  useEffect(() => { api.get("/content").then((r) => setContent(r.data || {})).catch(() => {}); }, []);
  const save = async () => {
    try {
      await api.put("/admin/content", content);
      toast.success("Conținut salvat!");
    } catch (err) { toast.error(formatApiError(err)); }
  };
  const setTheme = async (t) => {
    try {
      await api.put("/admin/content", { theme: t });
      setContent((c) => ({ ...c, theme: t }));
      document.documentElement.dataset.theme = t;
      toast.success(t === "ianuarie" ? "Temă Ianuarie activă — glass navigation" : "Temă de Iarnă activă — Crăciun");
    } catch (err) { toast.error(formatApiError(err)); }
  };
  const theme = content.theme === "ianuarie" ? "ianuarie" : "iarna";
  return (
    <div className="glass rounded-sm p-6 space-y-5 max-w-2xl" data-testid="admin-content-tab">
      <h3 className="font-display font-bold text-sm uppercase tracking-widest">Editare texte site</h3>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Temă site</label>
        <div className="flex gap-2" data-testid="theme-switcher">
          <button data-testid="theme-iarna" onClick={() => setTheme("iarna")}
            className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${theme === "iarna" ? "bg-[#f3c46a] text-black border-transparent" : "border-white/15 text-zinc-400 hover:text-white"}`}>
            Iarnă · Crăciun
          </button>
          <button data-testid="theme-ianuarie" onClick={() => setTheme("ianuarie")}
            className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${theme === "ianuarie" ? "bg-[#5ec8ff] text-black border-transparent" : "border-white/15 text-zinc-400 hover:text-white"}`}>
            Ianuarie · Glass
          </button>
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">Ianuarie = fără ninsoare/brazi/ghirlandă, navbar plutitor de sticlă, accente albastre.</p>
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Tagline hero (prima pagină)</label>
        <input data-testid="content-hero-tagline" value={content.hero_tagline || ""} onChange={(e) => setContent({ ...content, hero_tagline: e.target.value })}
          placeholder="Manele Remixate & Manele Artificiale" className={inputCls} />
      </div>
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Text „Despre" (intro)</label>
        <textarea data-testid="content-about" rows={5} value={content.about_text || ""} onChange={(e) => setContent({ ...content, about_text: e.target.value })} className={inputCls} />
      </div>
      <button data-testid="content-save" onClick={save} className="px-6 py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors">Salvează textele</button>
    </div>
  );
}
