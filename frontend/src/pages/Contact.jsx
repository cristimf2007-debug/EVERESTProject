import React, { useState } from "react";
import { Phone, Mail, Music2, Instagram, Youtube, AudioLines, Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

const SOCIALS = [
  { label: "YouTube", handle: "@djbioxic", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "contact-youtube" },
  { label: "TikTok", handle: "@bioxic.exe", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "contact-tiktok" },
  { label: "Instagram", handle: "@crss.exe_", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "contact-instagram" },
  { label: "Spotify", handle: "BIOXIC", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "contact-spotify" },
];

// Contact & chat direct — căsuța de mesaje ajunge la BIOXIC (panoul de admin + email)
export default function Contact() {
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendContact = async (e) => {
    e.preventDefault();
    if (!cName.trim() || !cEmail.trim() || !cMessage.trim()) return;
    setSending(true);
    try {
      await api.post("/contact", { name: cName.trim(), email: cEmail.trim(), subject: "Mesaj din site", message: cMessage.trim() });
      toast.success("Mesaj trimis!", { description: "Ajungе direct la BIOXIC — îți răspunde pe email." });
      setCName(""); setCEmail(""); setCMessage("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="contact-page" className="max-w-[1100px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <header className="rv">
        <p className="badge-engraved">Booking · Management · Fan mail</p>
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight mt-2">Contact <span className="text-[var(--flame)]">direct</span></h1>
        <p className="text-[var(--text-2)] text-sm sm:text-base mt-3 max-w-xl">
          Scrie-i lui BIOXIC direct din site — mesajul ajunge la el, iar răspunsul îți vine pe email.
        </p>
      </header>

      {/* cărți de contact */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10" data-testid="contact-cards">
        <div className="ob-card p-5 rv" data-testid="contact-card-phone">
          <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Phone size={16} /></span>
          <p className="font-display text-sm uppercase mt-3.5">Booking / Telefon</p>
          <p className="text-xs text-[var(--text-2)] mt-1.5">Numărul se afișează în curând — între timp, lasă mesaj mai jos.</p>
        </div>
        <div className="ob-card p-5 rv rv-d1" data-testid="contact-card-discord">
          <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><MessageCircle size={16} /></span>
          <p className="font-display text-sm uppercase mt-3.5">Discord Community</p>
          <p className="text-xs text-[var(--text-2)] mt-1.5">Serverul de Discord se deschide în curând — chatul live de pe site e activ acum.</p>
        </div>
        <div className="ob-card p-5 rv rv-d2" data-testid="contact-card-email">
          <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Mail size={16} /></span>
          <p className="font-display text-sm uppercase mt-3.5">Email</p>
          <p className="text-xs text-[var(--text-2)] mt-1.5">Folosește formularul — mesajul ajunge direct în inboxul lui.</p>
        </div>
        <div className="ob-card p-5 rv rv-d3" data-testid="contact-card-socials">
          <p className="font-display text-sm uppercase">Social & Management</p>
          <div className="flex flex-wrap gap-2 mt-3.5">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="knob knob-sm" aria-label={`${s.label} — ${s.handle}`} title={`${s.label} · ${s.handle}`} data-testid={s.tid}>
                  <Icon />
                </a>
              );
            })}
          </div>
          <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-3">TikTok · Instagram · YouTube · Spotify</p>
        </div>
      </div>

      {/* chat direct către Gmail-ul lui BIOXIC */}
      <section className="mt-12 rv" data-testid="contact-section">
        <p className="badge-engraved">Scrie-i direct</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mt-2">Mesaj pentru <span className="text-[var(--flame)]">BIOXIC</span></h2>
        <form onSubmit={sendContact} className="ob-card p-5 sm:p-7 mt-6 max-w-2xl" data-testid="contact-form">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              data-testid="contact-name"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Numele tău"
              maxLength={60}
              required
              className="input-recessed px-4 py-3 text-sm outline-none"
            />
            <input
              data-testid="contact-email"
              type="email"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="Emailul tău (primești răspuns aici)"
              maxLength={120}
              required
              className="input-recessed px-4 py-3 text-sm outline-none"
            />
          </div>
          <textarea
            data-testid="contact-message"
            value={cMessage}
            onChange={(e) => setCMessage(e.target.value)}
            placeholder="Salut BIOXIC! Am o propunere / o întrebare…"
            maxLength={2000}
            required
            rows={5}
            className="input-recessed w-full px-4 py-3 text-sm outline-none mt-3 resize-y"
          />
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">Răspunde personal, direct din Gmail</p>
            <button className="btn-flame" disabled={sending} data-testid="contact-send">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? "Se trimite…" : "Trimite mesajul"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
