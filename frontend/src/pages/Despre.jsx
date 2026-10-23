import React, { useEffect, useState } from "react";
import { Youtube, Music2, Instagram, AudioLines, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

const VINYL_IMG = "https://images.pexels.com/photos/27383804/pexels-photo-27383804.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const NEON_IMG = "https://images.unsplash.com/photo-1580397424400-2f12fdf0b3e7?crop=entropy&cs=srgb&fm=jpg&q=85";

const SOCIALS = [
  { label: "YouTube", handle: "@djbioxic", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "social-youtube" },
  { label: "TikTok", handle: "@bioxic.exe", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "social-tiktok" },
  { label: "Instagram", handle: "@crss.exe_", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "social-instagram" },
  { label: "Spotify", handle: "BIOXIC", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "social-spotify" },
];

export default function Despre() {
  const [stats, setStats] = useState({ tracks: 0, plays: 0 });
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cSubject, setCSubject] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [cSending, setCSending] = useState(false);

  useEffect(() => {
    api.get("/tracks").then((r) => {
      const list = r.data || [];
      setStats({ tracks: list.length, plays: list.reduce((s, t) => s + (t.plays || 0), 0) });
    }).catch(() => {});
  }, []);

  const sendContact = async (e) => {
    e.preventDefault();
    setCSending(true);
    try {
      await api.post("/contact", { name: cName.trim(), email: cEmail.trim(), subject: cSubject.trim() || "Contact site", message: cMessage.trim() });
      toast.success("Mesaj trimis!", { description: "Îți răspund cât pot de repede." });
      setCName(""); setCEmail(""); setCSubject(""); setCMessage("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setCSending(false);
    }
  };

  return (
    <div data-testid="despre-page" className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          <p className="text-[11px] font-mono-x uppercase tracking-[0.3em] text-[var(--cyan)]">Despre canal</p>
          <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight mt-3 leading-[0.95]">
            No risks,<br />no hits.
          </h2>
          <div className="text-[var(--muted)] text-sm sm:text-base leading-relaxed mt-6 space-y-4 max-w-lg">
            <p>
              BIOXIC face manele, remixuri și mashup-uri care nu stau mult pe YouTube.
              Piesele care dispar de peste tot ajung aici, în seif — și cântă non-stop pe radioul canalului, 24/7.
            </p>
            <p>
              Fără etichete, fără reguli. Dai play și ești alături de toți ceilalți ascultători,
              la aceeași secundă a aceleiași piese.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
            <div className="glass rounded-2xl p-5" data-testid="stat-tracks">
              <p className="font-display text-3xl font-black text-[var(--cyan)]">{stats.tracks}</p>
              <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--muted)] mt-1">Piese în rotație</p>
            </div>
            <div className="glass rounded-2xl p-5" data-testid="stat-plays">
              <p className="font-display text-3xl font-black text-[var(--amber)]">{stats.plays}</p>
              <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--muted)] mt-1">Redări totale</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <img src={VINYL_IMG} alt="BIOXIC studio" className="rounded-2xl w-full aspect-[4/5] object-cover border border-[var(--border)]" />
          <img
            src={NEON_IMG}
            alt=""
            className="absolute -bottom-8 -left-6 w-40 sm:w-52 rounded-xl border border-[var(--border-hi)] hidden sm:block"
            style={{ boxShadow: "0 20px 60px -20px rgba(0,240,255,.4)" }}
          />
        </div>
      </div>

      {/* social */}
      <section className="mt-20" data-testid="despre-socials">
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
          Mă găsești și <span className="text-[var(--cyan)]">aici</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {SOCIALS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                data-testid={s.tid}
                className="track-card glass rounded-2xl p-5 flex flex-col gap-3"
              >
                <Icon size={22} className="text-[var(--cyan)]" />
                <div>
                  <p className="text-[10px] font-mono-x uppercase tracking-[0.25em] text-[var(--faint)]">{s.label}</p>
                  <p className="font-bold text-sm sm:text-base mt-0.5">{s.handle}</p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* contact / booking */}
      <section className="mt-20" data-testid="contact-section">
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
          Booking & <span className="text-[var(--cyan)]">contact</span>
        </h3>
        <p className="text-[var(--muted)] text-sm mt-2 max-w-xl">
          Vrei colaborare, booking sau ai o piesă de dat? Scrie-mi aici — mesajele ajung direct la mine.
        </p>
        <form onSubmit={sendContact} className="glass rounded-2xl p-5 sm:p-7 mt-6 max-w-2xl" data-testid="contact-form">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              data-testid="contact-name"
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Numele tău"
              maxLength={80}
              className="rounded-xl bg-black/30 border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
            />
            <input
              data-testid="contact-email"
              required
              type="email"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="Email-ul tău"
              maxLength={120}
              className="rounded-xl bg-black/30 border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
            />
          </div>
          <input
            data-testid="contact-subject"
            value={cSubject}
            onChange={(e) => setCSubject(e.target.value)}
            placeholder="Subiect (ex: booking, colaborare)"
            maxLength={120}
            className="w-full rounded-xl bg-black/30 border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors mt-3"
          />
          <textarea
            data-testid="contact-message"
            required
            value={cMessage}
            onChange={(e) => setCMessage(e.target.value)}
            placeholder="Mesajul tău…"
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl bg-black/30 border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors mt-3 resize-none"
          />
          <button data-testid="contact-submit" disabled={cSending} className="btn-x gold mt-4 !py-3 !px-7 text-xs font-black uppercase tracking-[0.15em] disabled:opacity-50">
            <Mail size={14} /> {cSending ? "Se trimite…" : "Trimite mesajul"}
          </button>
        </form>
      </section>
    </div>
  );
}
