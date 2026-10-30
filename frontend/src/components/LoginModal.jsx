import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock } from "lucide-react";
import { toast } from "sonner";
import { useFan } from "@/context/FanContext";
import { formatApiError } from "@/lib/api";

// Login fani — Google (principal) sau email. `blocking` = poartă obligatorie: nu se închide până nu intri în cont
export default function LoginModal({ onClose, blocking = false }) {
  const { loginGoogle, loginEmail, registerEmail } = useFan();
  const [tab, setTab] = useState("google"); // google | email
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // cât e deschis, pagina din spate nu derulează
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submitEmail = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { toast.error("Scrie-ți numele."); setBusy(false); return; }
        await registerEmail(name.trim(), email.trim(), password);
      } else {
        await loginEmail(email.trim(), password);
      }
      toast.success("Bine ai venit în seif!");
      onClose?.();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[160] grid place-items-center px-4 login-bg"
      data-testid="login-modal"
      onClick={blocking ? undefined : onClose}
    >
      <div
        className="login-panel relative w-[360px] sm:w-[420px] p-8 sm:p-9"
        style={{ animation: "player-rise .45s cubic-bezier(.2,.9,.25,1.2) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {!blocking && (
          <button onClick={onClose} aria-label="Închide" data-testid="login-close" className="knob knob-sm absolute top-4 right-4">
            <X />
          </button>
        )}

        {/* logo-ul oficial alb, o singură dată */}
        <div className="grid place-items-center">
          <img
            src="/logo.png"
            alt="BIOXIC"
            className="h-16 w-auto object-contain"
            style={{ filter: "drop-shadow(0 12px 30px rgba(var(--flame-rgb),.3))" }}
            data-testid="login-logo"
          />
        </div>
        {blocking ? (
          <>
            <h3 className="font-display text-2xl text-center mt-5 flex items-center justify-center gap-2" data-testid="login-gate-title">
              <Lock size={16} className="text-[var(--flame)]" /> Zonă pentru membri
            </h3>
            <p className="text-sm text-[var(--text-2)] text-center mt-2 mb-7 leading-relaxed">
              Site-ul se folosește doar cu cont. Intră sau fă-ți unul — durează 10 secunde.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-display text-2xl text-center mt-5">Intră în cont</h3>
            <p className="text-sm text-[var(--text-2)] text-center mt-2 mb-7 leading-relaxed">Cont cu nume și poză de profil — apare pe chat și la păreri.</p>
          </>
        )}

        {tab === "google" ? (
          <>
            <button data-testid="login-google-button" onClick={loginGoogle} className="btn-x gold w-full justify-center !py-4 text-xs font-black uppercase tracking-[0.15em]">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#032530" d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.2-2.2A8.9 8.9 0 1 0 12 20.9c4.45 0 8.55-3.2 8.55-8.9 0-.3-.05-.6-.1-.9z"/></svg>
              Continuă cu Google
            </button>
            <button data-testid="login-email-tab" onClick={() => setTab("email")} className="w-full text-center text-[11px] font-mono-x uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--flame)] transition-colors mt-6">
              sau cu email →
            </button>
          </>
        ) : (
          <form onSubmit={submitEmail}>
            <div className="flex gap-2 mb-5">
              {["login", "register"].map((m) => (
                <button key={m} type="button" data-testid={`login-mode-${m}`} onClick={() => setMode(m)}
                  className={`flex-1 rounded-full py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border ${mode === m ? "border-transparent text-[#032530]" : "border-[var(--edge)] text-[var(--text-2)] hover:text-[var(--text)]"}`}
                  style={mode === m ? { background: "linear-gradient(180deg, #6FE7F7, var(--flame) 55%, var(--flame-deep))" } : {}}>
                  {m === "login" ? "Intră" : "Cont nou"}
                </button>
              ))}
            </div>
            {mode === "register" && (
              <input data-testid="login-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tău" maxLength={40}
                className="input-recessed w-full px-4 py-3.5 text-sm outline-none mb-3" />
            )}
            <input data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="input-recessed w-full px-4 py-3.5 text-sm outline-none" />
            <input data-testid="login-password-input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă (min 6 caractere)"
              className="input-recessed w-full px-4 py-3.5 text-sm outline-none mt-3" />
            <button data-testid="login-submit-button" disabled={busy} className="btn-x gold w-full justify-center !py-3.5 text-xs font-black uppercase tracking-widest mt-5 disabled:opacity-50">
              {busy ? "Se verifică…" : mode === "login" ? "Intră în cont" : "Creează contul"}
            </button>
            <button type="button" onClick={() => setTab("google")} className="w-full text-center text-[11px] font-mono-x uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--flame)] transition-colors mt-5">
              ← înapoi la Google
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
