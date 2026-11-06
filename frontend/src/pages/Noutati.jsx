import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Youtube, Instagram, Music2, AudioLines, Mail, Mountain, MessageCircle } from "lucide-react";

const PAYPAL_URL = "https://www.paypal.com/ncp/payment/47UXM5YBBLLPQ";
const DISCORD_URL = "https://discord.gg/jhCDSq7vqu";

const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "social-youtube" },
  { label: "TikTok", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "social-tiktok" },
  { label: "Instagram", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "social-instagram" },
  { label: "Spotify", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "social-spotify" },
];

// Homepage — introducerea în universul BIOXIC: identitate, label, sample pack, contact. Nu biografie.
export default function Noutati() {
  const reduceMotion = useReducedMotion();
  const entrance = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <div data-testid="home-page" className="relative">
      {/* ============ HERO ============ */}
      <section className="home-hero">
        <div className="hero-composition">
          <motion.div className="hero-story" {...entrance(0.08)}>
            <p className="hero-eyebrow" data-testid="hero-kicker">Cristian Maxim / România — UK</p>
            <h1 className="hero-title">BIOXIC<span className="hero-period">.</span></h1>
            <p className="hero-manifesto" data-testid="hero-slogan">Unde rădăcinile<br />întâlnesc viitorul.</p>
            <p className="text-[var(--text-2)] text-base sm:text-lg leading-relaxed mt-6 max-w-lg" data-testid="hero-intro">
              Cristian Maxim este BIOXIC — producător muzical și fondatorul Everest Manele.
              O identitate construită între România și Regatul Unit.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <Link to="/despre" className="btn-flame" data-testid="hero-btn-despre">Despre mine</Link>
              <Link to="/contact" className="btn-steel" data-testid="hero-btn-contact">Contact</Link>
              <Link to="/everest-manele" className="btn-ghost rounded-full h-12 px-6 inline-flex items-center gap-2 text-[11px] font-mono-x uppercase tracking-widest" data-testid="hero-btn-everest">
                Everest Manele <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex items-center gap-2.5 mt-9" data-testid="hero-socials">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="knob" aria-label={s.label} title={s.label} data-testid={s.tid}>
                    <Icon />
                  </a>
                );
              })}
            </div>
          </motion.div>
          <motion.figure className="hero-image-column" {...entrance(0.2)}>
            <motion.div
              className="hero-portrait"
              data-testid="hero-portrait"
              initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0)", scale: 1.025 }}
              animate={{ clipPath: "inset(0 0 0% 0)", scale: 1 }}
              transition={{ duration: 1.05, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src="/artist.jpg" alt="BIOXIC — Cristian Maxim" fetchPriority="high" />
              <span className="portrait-index" aria-hidden="true">01 / BIOXIC</span>
            </motion.div>
            <figcaption className="hero-caption"><span>Music producer</span><span>Founder · Everest Manele</span></figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ============ EVEREST MANELE — prezentare minimalistă ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 py-14 sm:py-20 border-t border-[var(--edge)]" data-testid="home-label">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 rv">
            <p className="sec-kicker"><Mountain size={12} /> Casa de discuri</p>
            <h2 className="sec-title mt-4">Everest Manele</h2>
            <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-5 max-w-md">
              Label-ul independent fondat de BIOXIC — casa sub care apar remixurile, mashup-urile
              și producțiile semnate Cristian Maxim, fără compromisuri și fără intermediari.
            </p>
            <Link to="/everest-manele" className="btn-steel !h-11 !px-6 mt-7 inline-flex" data-testid="home-label-cta">
              Descoperă label-ul <ArrowRight size={13} />
            </Link>
          </div>
          <div className="lg:col-span-7 rv rv-d1">
            <div className="label-art" data-testid="home-label-art">
              <Mountain size={64} strokeWidth={1} aria-hidden="true" />
              <strong>EVEREST<br />MANELE</strong>
              <span>Label independent / BIOXIC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SAMPLE PACK VOL. 1 — card premium cu cumpărare ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-10" data-testid="home-samplepack">
        <div className="cta-band p-8 sm:p-12 lg:p-14 rv">
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <p className="font-mono-x text-[10px] uppercase tracking-[0.28em] text-[#E8B48F]" data-testid="sp-kicker">Everest Manele · Produs digital</p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-4" data-testid="sp-title">
                Sample Pack <span className="text-[#E06D44]">Vol. 1</span>
              </h2>
              <p className="text-[#D6CFC4] text-sm sm:text-base leading-relaxed mt-4 max-w-xl">
                Primul pachet oficial de sunete de la Everest Manele — construit din sesiunile de producție BIOXIC,
                gata de folosit în propriile tale piese.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <div className="flex flex-col items-stretch gap-3 w-full lg:w-auto">
                <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="btn-flame !h-13 !px-8 w-full lg:w-auto" data-testid="sp-buy-paypal">
                  Cumpără cu PayPal
                </a>
                <Link to="/sample-pack" className="btn-ghost rounded-full h-11 px-6 inline-flex items-center justify-center gap-2 text-[10px] font-mono-x uppercase tracking-widest !text-[#D6CFC4] !border-white/25 hover:!bg-white/10" data-testid="sp-details">
                  Detalii pachet <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT & COLABORĂRI ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 py-14 sm:py-20" data-testid="home-contact">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 rv">
            <p className="sec-kicker"><Mail size={12} /> Contact & Colaborări</p>
            <h2 className="sec-title mt-4">Hai să lucrăm împreună</h2>
            <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed mt-5 max-w-lg">
              Booking, colaborări, remixuri la comandă sau doar un salut — scrie-mi direct
              și îți răspund personal. Comunitatea e activă și pe Discord.
            </p>
          </div>
          <div className="lg:col-span-5 rv rv-d1 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
            <Link to="/contact" className="btn-flame" data-testid="home-contact-cta">Trimite un mesaj</Link>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn-steel" data-testid="home-discord-cta">
              <MessageCircle size={14} /> Discord · BIOXIC House
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
