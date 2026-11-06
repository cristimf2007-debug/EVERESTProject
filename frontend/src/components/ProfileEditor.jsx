import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImagePlus, LoaderCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError, mediaUrl } from "@/lib/api";

const DEFAULT_PRIVACY = { profile_public: true, show_followers: true, allow_friend_requests: true };
const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,23}$/;

export default function ProfileEditor({ me, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: me.username || "",
    name: me.name || "",
    bio: me.bio || "",
    privacy: { ...DEFAULT_PRIVACY, ...(me.privacy || {}) },
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector('input:not([type="file"])')?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "Tab" && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled)")];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  const uploadImage = async (event, kind) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error("Alege o imagine JPG, PNG sau WebP de maximum 10 MB.");
      return;
    }
    setUploading(kind);
    try {
      const body = new FormData();
      body.append(kind, file);
      const { data } = await api.post(`/fans/me/${kind}`, body);
      const updated = { ...me, [kind === "avatar" ? "picture" : "banner"]: data[kind === "avatar" ? "picture" : "banner"] };
      onSaved(updated);
      toast.success(kind === "avatar" ? "Avatar actualizat." : "Banner actualizat.");
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setUploading("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const username = form.username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
      toast.error("Numele de utilizator trebuie să aibă 3-24 caractere și să conțină doar litere, cifre, _ sau -.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch("/fans/me", {
        username,
        name: form.name.trim(),
        bio: form.bio.trim(),
        privacy: form.privacy,
      });
      onSaved(data);
      toast.success("Profilul a fost actualizat.");
      onClose();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[165] grid place-items-center overflow-y-auto bg-black/75 px-3 py-5 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <motion.section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="profile-editor-title"
          className="w-full max-w-lg overflow-hidden rounded-[26px] border border-white/10 bg-[#111315] shadow-[0_30px_100px_rgba(0,0,0,.65)]"
          initial={reducedMotion ? false : { opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }} transition={{ duration: reducedMotion ? 0 : .22 }}
          onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4">
            <div><h2 id="profile-editor-title" className="font-display text-lg">Editează profilul</h2><p className="mt-1 text-xs text-white/45">Detalii publice și confidențialitate</p></div>
            <button type="button" onClick={onClose} aria-label="Închide" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/65 hover:bg-white/5"><X size={17} /></button>
          </div>

          <div className="relative h-32 bg-[radial-gradient(ellipse_at_70%_15%,rgba(195,114,69,.28),transparent_55%),linear-gradient(135deg,#25201d,#111315_65%)]">
            {me.banner && <img src={mediaUrl(me.banner)} alt="" className="h-full w-full object-cover" />}
            <label className="account-upload-label absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-[11px] text-white hover:bg-black/75">
              {uploading === "banner" ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {uploading === "banner" ? "Se încarcă…" : "Schimbă bannerul"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadImage(event, "banner")} disabled={!!uploading} />
            </label>
          </div>
          <form onSubmit={submit} className="space-y-4 px-5 pb-5 pt-4">
            <div className="-mt-10 flex items-end justify-between">
              <span className="grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-full border-4 border-[#111315] bg-[#292724] text-lg font-semibold">
                {me.picture ? <img src={mediaUrl(me.picture)} alt="" className="h-full w-full object-cover" /> : (me.name || "F").slice(0, 1).toUpperCase()}
              </span>
              <label className="account-upload-label mb-1 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[11px] text-white/75 hover:bg-white/[.08]">
                {uploading === "avatar" ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                {uploading === "avatar" ? "Se încarcă…" : "Schimbă avatarul"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadImage(event, "avatar")} disabled={!!uploading} />
              </label>
            </div>

            <label className="block text-xs text-white/60">Nume de utilizator
              <div className="mt-1 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-[var(--flame)]/50">
                <span className="text-sm text-white/35">@</span>
                <input required minLength={3} maxLength={24} value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none" autoComplete="username" />
              </div>
              <span className="mt-1 block text-[10px] text-white/35">URL-ul profilului: /u/{form.username || "nume"}</span>
            </label>
            <label className="block text-xs text-white/60">Nume afișat
              <input required maxLength={60} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[var(--flame)]/50" />
            </label>
            <label className="block text-xs text-white/60">Despre tine <span className="text-white/35">(maxim 300 caractere)</span>
              <textarea maxLength={300} rows={3} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[var(--flame)]/50" />
            </label>
            <fieldset className="space-y-2 border-t border-white/[.07] pt-3">
              <legend className="mb-2 text-xs font-semibold text-white/80">Confidențialitate</legend>
              {[
                ["profile_public", "Profil public"],
                ["show_followers", "Afișează urmăritorii și lista urmărită"],
                ["allow_friend_requests", "Permite cereri de prietenie"],
              ].map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-4 text-xs text-white/65">
                  {label}
                  <input type="checkbox" checked={!!form.privacy[key]} onChange={(event) => setForm((current) => ({
                    ...current, privacy: { ...current.privacy, [key]: event.target.checked },
                  }))} className="accent-[var(--flame)]" />
                </label>
              ))}
            </fieldset>
            <button type="submit" disabled={saving || !!uploading} className="btn-flame flex w-full items-center justify-center gap-2 !py-3.5 disabled:opacity-50">
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Se salvează…" : "Salvează profilul"}
            </button>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
