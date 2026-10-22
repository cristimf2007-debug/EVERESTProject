import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, Heart, Music, User as UserIcon } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";

export default function FanProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/fans/${userId}/public`).then((r) => setProfile(r.data)).catch(() => setError(true));
  }, [userId]);

  if (error) {
    return <div className="min-h-[50vh] flex items-center justify-center text-zinc-500" data-testid="profile-not-found">Profil inexistent.</div>;
  }
  if (!profile) {
    return <div className="min-h-[50vh] flex items-center justify-center text-zinc-500" data-testid="profile-loading">Se încarcă...</div>;
  }

  return (
    <div data-testid="fan-profile-page" className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* BANNER */}
      <div className="relative h-44 sm:h-60 rounded-sm overflow-hidden border border-white/10" data-testid="profile-banner">
        {profile.banner ? (
          <img src={mediaUrl(profile.banner)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(57,255,20,0.15) 0%, #050805 60%)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050805] to-transparent" />
      </div>

      {/* HEADER PROFIL */}
      <div className="flex flex-wrap items-end gap-5 -mt-12 relative z-10 px-4">
        {profile.picture ? (
          <img src={mediaUrl(profile.picture)} alt={profile.name} className="w-24 h-24 rounded-full border-4 border-[#050805] object-cover box-glow" data-testid="profile-avatar" />
        ) : (
          <span className="w-24 h-24 rounded-full border-4 border-[#050805] bg-[#39FF14]/15 flex items-center justify-center" data-testid="profile-avatar">
            <UserIcon size={36} className="text-[#39FF14]" />
          </span>
        )}
        <div className="flex-1 min-w-0 pb-1">
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight truncate" data-testid="profile-name">{profile.name}</h1>
          <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
            <CalendarDays size={12} /> Fan din {profile.created_at ? new Date(profile.created_at).toLocaleDateString("ro-RO") : "2026"}
          </p>
        </div>
      </div>

      {profile.bio && <p className="mt-6 text-zinc-300 text-sm leading-relaxed max-w-2xl px-1" data-testid="profile-bio">{profile.bio}</p>}

      {/* FAVORITE */}
      <section className="mt-10">
        <h2 className="font-display font-bold text-lg uppercase tracking-widest mb-5 flex items-center gap-2">
          <Heart size={16} className="text-[#39FF14]" fill="#39FF14" /> Piese favorite
        </h2>
        {profile.favorites.length === 0 && <p className="text-zinc-500 text-sm">Nicio piesă favorită publică încă.</p>}
        <div className="space-y-2">
          {profile.favorites.map((t) => (
            <Link key={t.id} to={`/muzica?track=${t.id}`} data-testid={`profile-fav-${t.id}`}
              className="glass rounded-sm px-4 py-3 flex items-center gap-4 hover:border-[#39FF14]/40 transition-colors">
              {t.cover_url ? <img src={mediaUrl(t.cover_url)} alt="" className="w-10 h-10 object-cover rounded-sm" /> : <Music size={16} className="text-[#39FF14]" />}
              <span className="flex-1 text-sm font-semibold truncate">{t.title}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{t.genre}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
