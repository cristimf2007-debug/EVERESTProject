import React, { useState } from "react";
import { Phone, Mail, Music2, Instagram, Youtube, AudioLines, Send, Loader2, MessageCircle, Heart, Copy } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

const SOCIALS = [
  { label: "Discord", handle: "BIOXIC House", href: "https://discord.gg/jhCDSq7vqu", icon: MessageCircle, tid: "contact-discord" },
  { label: "YouTube", handle: "@djbioxic", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "contact-youtube" },
  { label: "TikTok", handle: "@bioxic.exe", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "contact-tiktok" },
  { label: "Instagram", handle: "@crss.exe_", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "contact-instagram" },
  { label: "Spotify", handle: "BIOXIC", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "contact-spotify" },
];
const EMAIL = "contact@everestmanele.com";
const WHATSAPP = "https://wa.me/447400998964";
const BANK = [
  { label: "Sort code", value: "20-25-98", tid: "contact-copy-sort" },
  { label: "Cont", value: "73583767", tid: "contact-copy-cont" },
];

function CopyChip({ value, tid }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--edge)] bg-black/30 px-2.5 py-1.5 text-[11px] font-mono-x tracking-wider hover:border-[rgba(var(--flame-rgb),.5)] hover:text-[var(--flame)] transition-colors"
      data-testid={tid}
      aria-label={`Copiază ${value}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); }
        catch {
          const ta = document.createElement("textarea");
          ta.value = value; document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); ta.remove();
        }
        toast.success("Copiat ✓");
      }}
    >
      {value} <Copy size={11} />
    </button>
  );
}

// Contact & chat direct — căsuța de mesaje ajunge la BIOXIC (panoul de admin + email)
export default function Contact() {
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cSubject, setCSubject] = useState("");
  const [cType, setCType] = useState("Colaborări muzicale");
  const [cMessage, setCMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendContact = async (e) => {
    e.preventDefault();
    if (!cName.trim() || !cEmail.trim() || !cMessage.trim()) return;
    setSending(true);
    try {
      await api.post("/contact", {
        name: cName.trim(),
        email: cEmail.trim(),
        subject: `${cType}: ${cSubject.trim()}`,
        message: cMessage.trim(),
      });
      toast.success("Mesaj trimis!", { description: "Mesajul a fost confirmat de server." });
      setCName(""); setCEmail(""); setCSubject(""); setCType("Colaborări muzicale"); setCMessage("");
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
        <a href={WHATSAPP} target="_blank" rel="noreferrer" className="ob-card p-5 rv block hover:border-[var(--edge-hi)] transition-colors" data-testid="contact-card-phone">
          <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Phone size={16} /></span>
          <p className="font-display text-sm uppercase mt-3.5">WhatsApp / Booking</p>
          <p className="text-xs text-[var(--text-2)] mt-1.5">+44 7400 998964 — răspunde direct, de obicei în aceeași zi.</p>
        </a>
        <a href={`mailto:${EMAIL}`} className="ob-card p-5 rv rv-d2 block hover:border-[var(--edge-hi)] transition-colors" data-testid="contact-card-email">
          <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Mail size={16} /></span>
          <p className="font-display text-sm uppercase mt-3.5">Email</p>
          <p className="text-xs text-[var(--text-2)] mt-1.5 break-all">{EMAIL} — sau folosește formularul de mai jos.</p>
        </a>
        <div className="ob-card p-5 rv rv-d1" data-testid="contact-card-support">
          <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Heart size={16} /></span>
          <p className="font-display text-sm uppercase mt-3.5">Susține</p>
          <p className="text-xs text-[var(--text-2)] mt-1.5">Sprijin opțional prin transfer bancar.</p>
          <p className="text-[9px] font-mono-x uppercase tracking-[0.18em] text-[var(--text-3)] mt-3.5 mb-1.5">Transfer UK · C Maxim</p>
          <div className="flex flex-wrap gap-1.5">
            {BANK.map((b) => <CopyChip key={b.label} value={b.value} tid={b.tid} />)}
          </div>
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
              aria-label="Nume" data-testid="contact-name"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Numele tău"
              maxLength={60}
              required
              className="input-recessed px-4 py-3 text-sm outline-none"
            />
            <input
              aria-label="Email" data-testid="contact-email"
              type="email"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="Emailul tău (primești răspuns aici)"
              maxLength={120}
              required
              className="input-recessed px-4 py-3 text-sm outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 mt-3">
            <input
              aria-label="Subiect" data-testid="contact-subject"
              value={cSubject}
              onChange={(e) => setCSubject(e.target.value)}
              placeholder="Subiectul mesajului"
              maxLength={120}
              required
              className="input-recessed px-4 py-3 text-sm outline-none"
            />
            <select
              aria-label="Tipul mesajului" data-testid="contact-type"
              value={cType}
              onChange={(e) => setCType(e.target.value)}
              className="input-recessed px-4 py-3 text-sm outline-none"
              aria-label="Tip solicitare"
            >
              <option>Colaborări muzicale</option>
              <option>Parteneriate</option>
              <option>Solicitări comerciale</option>
              <option>Contact general</option>
            </select>
          </div>
          <textarea
            aria-label="Mesaj" data-testid="contact-message"
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
