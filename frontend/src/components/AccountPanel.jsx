import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bell, ChevronRight, Film, LogOut, MessageCircle, Settings2,
  ShieldCheck, UserRound, UserRoundPen, Users, UserPlus, UserRoundCheck, X,
} from "lucide-react";
import { mediaUrl } from "@/lib/api";

const LINKS = [
  { to: "/community?tab=messages", label: "Mesaje private", icon: MessageCircle },
  { to: "/community?tab=friends", label: "Prieteni & cereri", icon: Users },
  { to: "/community?tab=followers", label: "Urmăritori", icon: UserRoundCheck },
  { to: "/community?tab=following", label: "Urmărești", icon: UserPlus },
  { to: "/community?tab=notifications", label: "Notificări", icon: Bell },
  { to: "/live", label: "Live Demo", icon: Film },
];

export default function AccountPanel({
  me, isAdmin, onClose, onEditProfile, onOpenAccessibility, onLogout,
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const reducedMotion = useReducedMotion();
  const username = me.username || me.user_id;
  const profileUrl = `/u/${encodeURIComponent(username)}`;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("button, a")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll("a[href], button:not(:disabled)")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  const transition = reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 30 };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[155] flex items-start justify-center overflow-y-auto px-3 py-5 sm:items-center sm:px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.18 }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        style={{ background: "rgba(4, 6, 8, .74)", backdropFilter: "blur(16px)" }}
        data-testid="account-panel-backdrop"
      >
        <motion.section
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-panel-title"
          data-testid="account-panel"
          className="account-panel-surface relative my-auto w-full max-w-[440px] overflow-hidden rounded-[26px] border border-white/[.1]"
          initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
          transition={transition}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="relative h-36 overflow-hidden sm:h-40">
            {me.banner ? (
              <img src={mediaUrl(me.banner)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_70%_15%,rgba(195,114,69,.28),transparent_55%),linear-gradient(135deg,#25201d,#111315_65%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101214] via-black/10 to-black/20" />
            <button type="button" onClick={onClose} aria-label="Închide contul" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/35 text-white/75 transition hover:bg-black/60 hover:text-white" data-testid="account-close">
              <X size={17} />
            </button>
            <Link to={profileUrl} onClick={onClose} className="absolute bottom-3 left-4 flex min-w-0 items-center gap-3 sm:left-5">
              <span className="grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-[#111315] bg-[#292724] text-lg font-bold shadow-[0_8px_24px_rgba(0,0,0,.4)]">
                {me.picture ? <img src={mediaUrl(me.picture)} alt="" className="h-full w-full object-cover" /> : (me.name || "F").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 pb-1">
                <span id="account-panel-title" className="block truncate text-base font-semibold text-white">{me.name || "Fan BIOXIC"}</span>
                <span className="block truncate text-xs text-white/55">@{me.username || "profil"}</span>
              </span>
            </Link>
          </div>

          <div className="px-3 pb-3 pt-1 sm:px-4">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Link to={profileUrl} onClick={onClose} className="account-panel-primary" data-testid="account-view-profile">
                <UserRound size={15} /> Vezi profilul <ChevronRight size={14} className="ml-auto opacity-50" />
              </Link>
              <button type="button" onClick={onEditProfile} className="account-panel-primary" data-testid="account-edit-profile">
                <UserRoundPen size={15} /> Editează profilul
              </button>
            </div>
            <nav aria-label="Cont și comunitate" className="grid gap-0.5">
              {LINKS.map(({ to, label, icon: Icon }, index) => (
                <motion.div key={to} initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={reducedMotion ? { duration: 0 } : { delay: 0.025 * index, duration: 0.16 }}>
                  <Link to={to} onClick={onClose} className="account-panel-link" data-testid={`account-link-${to.split("=")[1] || label.toLowerCase().replaceAll(" ", "-")}`}>
                    <Icon size={16} className="text-[var(--text-2)]" /> {label} <ChevronRight size={14} className="ml-auto opacity-35" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="my-2 border-t border-white/[.07]" />
            {isAdmin && (
              <Link to="/admin" onClick={onClose} className="account-panel-link" data-testid="account-admin">
                <ShieldCheck size={16} className="text-[var(--flame)]" /> Panou admin <ChevronRight size={14} className="ml-auto opacity-35" />
              </Link>
            )}
            <button type="button" onClick={onEditProfile} className="account-panel-link" data-testid="account-settings">
              <Settings2 size={16} className="text-[var(--text-2)]" /> Setări cont și confidențialitate <ChevronRight size={14} className="ml-auto opacity-35" />
            </button>
            <button type="button" onClick={onOpenAccessibility} className="account-panel-link" data-testid="account-accessibility">
              <Settings2 size={16} className="text-[var(--text-2)]" /> Accesibilitate <ChevronRight size={14} className="ml-auto opacity-35" />
            </button>
            <button type="button" onClick={onLogout} className="account-panel-link text-red-200/85 hover:bg-red-400/[.08]" data-testid="account-logout">
              <LogOut size={16} /> Ieși din cont
            </button>
            <p className="px-3 pt-1 text-[10px] text-white/30">{me.email}</p>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
