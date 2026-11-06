import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, UserPlus, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { useFan } from "@/context/FanContext";
import ProfileEditor from "@/components/ProfileEditor";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { me, setMe, setLoginOpen } = useFan();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const ownProfile = !!me && typeof me === "object" && me.username === username;

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/fans/${encodeURIComponent(username)}/public`)
      .then(({ data }) => { if (active) setProfile(data); })
      .catch((error) => { if (active) toast.error(formatApiError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  const follow = async () => {
    if (!me || typeof me !== "object") { setLoginOpen(true); return; }
    setBusy(true);
    try {
      if (profile.is_following) {
        await api.delete(`/fans/social/follow/${encodeURIComponent(profile.username)}`);
        setProfile((current) => ({ ...current, is_following: false }));
      } else {
        await api.post("/fans/social/follow", { username: profile.username });
        setProfile((current) => ({ ...current, is_following: true }));
      }
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setBusy(false);
    }
  };

  const requestFriendship = async () => {
    if (!me || typeof me !== "object") { setLoginOpen(true); return; }
    setBusy(true);
    try {
      await api.post("/fans/friends/requests", { username: profile.username });
      toast.success("Cererea de prietenie a fost trimisă.");
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="mx-auto grid min-h-[50vh] max-w-3xl place-items-center"><LoaderCircle className="animate-spin text-white/45" /></div>;
  if (!profile) return <div className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="text-xl font-semibold">Profilul nu este disponibil</h1><Link to="/" className="mt-4 inline-block text-sm text-[var(--flame)]">Înapoi acasă</Link></div>;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-xs text-white/55 hover:text-white"><ArrowLeft size={15} /> Înapoi</button>
      <article className="overflow-hidden rounded-[26px] border border-white/[.09] bg-[#111315] shadow-[0_30px_90px_rgba(0,0,0,.35)]">
        <div className="relative h-48 bg-[radial-gradient(ellipse_at_70%_15%,rgba(195,114,69,.28),transparent_55%),linear-gradient(135deg,#25201d,#111315_65%)] sm:h-64">
          {profile.banner && <img src={mediaUrl(profile.banner)} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111315] via-transparent to-black/10" />
        </div>
        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-end gap-4">
              <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-[5px] border-[#111315] bg-[#292724] text-2xl font-semibold shadow-xl">
                {profile.picture ? <img src={mediaUrl(profile.picture)} alt="" className="h-full w-full object-cover" /> : profile.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 pb-2">
                <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{profile.name}</h1>
                <p className="mt-1 truncate text-sm text-white/45">@{profile.username}</p>
              </div>
            </div>
            <div className="flex gap-2 pb-2">
              {ownProfile ? (
                <button onClick={() => setEditing(true)} className="btn-steel !h-10 !px-4 !text-xs">Editează profilul</button>
              ) : (
                <>
                  <button disabled={busy} onClick={follow} className="btn-steel inline-flex !h-10 items-center gap-2 !px-4 !text-xs disabled:opacity-50">
                    {profile.is_following ? <UserRoundCheck size={14} /> : <UserPlus size={14} />}
                    {profile.is_following ? "Urmărești" : "Urmărește"}
                  </button>
                  {profile.friend_status === "friends" ? (
                    <Link to={`/community?tab=messages&with=${encodeURIComponent(profile.user_id)}`} className="btn-flame inline-flex !h-10 items-center gap-2 !px-4 !text-xs">Mesaje</Link>
                  ) : profile.friend_status === "sent" ? (
                    <button disabled className="btn-steel !h-10 !px-4 !text-xs opacity-70">Cerere trimisă</button>
                  ) : profile.friend_status === "received" ? (
                    <Link to="/community?tab=friends" className="btn-flame !h-10 !px-4 !text-xs">Vezi cererea</Link>
                  ) : (
                    <button disabled={busy} onClick={requestFriendship} aria-label="Trimite cerere de prietenie" className="btn-flame !h-10 !px-3 disabled:opacity-50"><UserPlus size={15} /></button>
                  )}
                </>
              )}
            </div>
          </div>
          {profile.bio && <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/70">{profile.bio}</p>}
          <div className="mt-6 flex gap-6 border-t border-white/[.07] pt-5 text-xs">
            <span><strong className="text-white">{profile.followers ?? "—"}</strong><span className="ml-1.5 text-white/45">urmăritori</span></span>
            <span><strong className="text-white">{profile.following ?? "—"}</strong><span className="ml-1.5 text-white/45">urmărește</span></span>
            <span className="text-white/40">Membru din {profile.created_at ? new Date(profile.created_at).toLocaleDateString("ro-RO", { month: "long", year: "numeric" }) : "BIOXIC"}</span>
          </div>
        </div>
        {profile.favorites?.length > 0 && (
          <section className="border-t border-white/[.07] px-5 py-6 sm:px-8">
            <h2 className="text-sm font-semibold">Piese apreciate</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {profile.favorites.map((track) => (
                <Link key={track.id} to="/muzica" className="rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-3 hover:bg-white/[.05]">
                  <span className="block truncate text-sm font-medium">{track.title}</span><span className="mt-1 block text-xs text-white/40">{track.artist}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
      {editing && <ProfileEditor me={me} onClose={() => setEditing(false)} onSaved={(updated) => {
        setMe(updated);
        setProfile((current) => ({ ...current, username: updated.username, name: updated.name, picture: updated.picture, banner: updated.banner, bio: updated.bio }));
        navigate(`/u/${encodeURIComponent(updated.username)}`, { replace: true });
      }} />}
    </div>
  );
}
