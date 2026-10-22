import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Heart, ShieldCheck, Bell, User as UserIcon, Music } from "lucide-react";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { useFan } from "@/context/FanContext";
import { toast } from "sonner";

const inputCls = "w-full bg-black/40 border border-white/10 px-4 py-3 text-sm focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition-colors";

function GoogleButton() {
  const start = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/cont";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button data-testid="google-login-button" onClick={start}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 font-semibold text-sm rounded-sm hover:bg-gray-100 transition-colors border border-gray-300">
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
      Continuă cu Google
    </button>
  );
}

export default function Cont() {
  const { fan, setFan, logout } = useFan();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (fan) api.get("/fans/favorites").then((r) => setFavorites(r.data || [])).catch(() => {});
  }, [fan]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = mode === "login"
        ? await api.post("/fans/login", { email: form.email, password: form.password })
        : await api.post("/fans/register", form);
      localStorage.setItem("bioxic_fan_token", r.data.token);
      setFan(r.data.user);
      toast.success(mode === "login" ? `Salut, ${r.data.user.name}!` : "Cont creat! Bine ai venit în comunitatea BIOXIC.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (fan === null) {
    return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500" data-testid="cont-loading">Se încarcă...</div>;
  }

  if (fan) {
    return (
      <div data-testid="fan-profile" className="max-w-3xl mx-auto px-6 py-14">
        <div className="glass rounded-sm p-8 mb-8">
          <div className="flex items-center gap-5">
            {fan.picture ? (
              <img src={fan.picture} alt={fan.name} className="w-16 h-16 rounded-full border-2 border-[#39FF14]" data-testid="fan-avatar" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-[#39FF14]/15 border-2 border-[#39FF14] flex items-center justify-center" data-testid="fan-avatar">
                <UserIcon size={26} className="text-[#39FF14]" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl uppercase tracking-tight truncate" data-testid="fan-name">{fan.name}</h1>
              <p className="text-sm text-zinc-500 truncate">{fan.email}</p>
            </div>
            <button data-testid="fan-logout" onClick={logout} className="flex items-center gap-2 px-4 py-2.5 border border-white/15 text-xs uppercase tracking-widest text-zinc-400 hover:text-red-400 hover:border-red-400/50 transition-colors">
              <LogOut size={13} /> Ieșire
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-black/30 border border-white/5 p-4 flex items-center gap-3">
              <Bell size={16} className="text-[#39FF14] shrink-0" />
              <p className="text-xs text-zinc-400">Primești email la fiecare piesă nouă și live</p>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 flex items-center gap-3">
              <ShieldCheck size={16} className="text-[#39FF14] shrink-0" />
              <p className="text-xs text-zinc-400">Cont verificat, fără spam</p>
            </div>
          </div>
        </div>

        <h2 className="font-display font-bold text-lg uppercase tracking-widest mb-5 flex items-center gap-2">
          <Heart size={17} className="text-[#39FF14]" fill="#39FF14" /> Piesele tale favorite
        </h2>
        {favorites.length === 0 && (
          <p className="text-zinc-500 text-sm" data-testid="no-favorites">Nicio piesă favorită încă. Apasă pe inimioară la orice piesă din <a href="/muzica" className="text-[#39FF14] underline">Muzică</a>.</p>
        )}
        <div className="space-y-3">
          {favorites.map((t) => (
            <a key={t.id} href={`/muzica?track=${t.id}`} data-testid={`favorite-${t.id}`} className="glass rounded-sm p-4 flex items-center gap-4 hover:border-[#39FF14]/40 transition-colors">
              {t.cover_url ? <img src={mediaUrl(t.cover_url)} alt="" className="w-11 h-11 object-cover rounded-sm" /> : <Music size={18} className="text-[#39FF14]" />}
              <span className="flex-1 text-sm font-semibold truncate">{t.title}</span>
              <span className="text-[11px] text-zinc-500 uppercase">{t.genre}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="cont-page" className="min-h-[80vh] flex items-center justify-center px-6 py-14">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-alt.png" alt="BIOXIC" className="h-8 mx-auto mb-5" />
          <h1 className="font-display font-black text-xl uppercase tracking-tight">Cont de fan</h1>
          <p className="text-xs text-zinc-500 mt-2">Favorite, notificări la lansări, acces la comunitate.</p>
        </div>

        <GoogleButton />
        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">sau cu email</span>
          <span className="flex-1 h-px bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 border border-white/10 mb-6" data-testid="auth-mode-tabs">
          {[["login", "Autentificare"], ["register", "Cont nou"]].map(([k, label]) => (
            <button key={k} data-testid={`auth-mode-${k}`} onClick={() => setMode(k)}
              className={`py-2.5 text-xs uppercase tracking-widest transition-colors ${mode === k ? "bg-[#39FF14] text-black font-bold" : "text-zinc-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4" data-testid="fan-auth-form">
          {mode === "register" && (
            <input data-testid="fan-name-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Numele tău" className={inputCls} />
          )}
          <input data-testid="fan-email-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inputCls} />
          <input data-testid="fan-password-input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Parolă (min. 6 caractere)" className={inputCls} />
          <button data-testid="fan-auth-submit" disabled={busy}
            className="w-full py-3.5 bg-[#39FF14] text-black font-display font-bold text-sm tracking-widest uppercase hover:bg-[#00C853] transition-colors disabled:opacity-50">
            {busy ? "Se procesează..." : mode === "login" ? "Intră în cont" : "Creează contul"}
          </button>
        </form>

        <p className="text-[11px] text-zinc-600 text-center mt-6 leading-relaxed">
          <ShieldCheck size={11} className="inline mr-1 text-[#00C853]" />
          Datele tale sunt în siguranță. Nu trimitem spam — doar piese noi și anunțuri de live.
        </p>
      </motion.div>
    </div>
  );
}
