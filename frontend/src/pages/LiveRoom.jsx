import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Square, Volume2, Heart, ListPlus, Share2, Loader2, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRadio } from "@/context/RadioContext";
import api, { mediaUrl } from "@/lib/api";
import SpectrumVinyl from "@/components/SpectrumVinyl";
import LiveChat from "@/components/LiveChat";
import PlayKnob from "@/components/PlayKnob";
import { dominantColor } from "@/lib/coverColor";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function typeBadge(title, genre) {
  const t = (title || "").toLowerCase();
  if (t.includes("mashup")) return "MASHUP";
  if (t.includes("remix") || t.includes("remixed")) return "REMIX";
  if (t.includes("cover")) return "COVER AI";
  return (genre || "MANEA").toUpperCase();
}

// Camera Live — layout modular: header sus, viewport de sticlă cu vinyl+spectrum la centru,
// controale jos, chat coloană de sticlă. Fără suprapuneri.
export default function LiveRoom() {
  const navigate = useNavigate();
  const { liveInfo, current, mode, status, playing, progress, duration, volume, listeners, queue, toggle, stop, setVolume } = useRadio();
  const [accent, setAccent] = useState(null);
  const [bpm, setBpm] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bursts, setBursts] = useState([]);
  const [floatsRoom, setFloatsRoom] = useState([]);
  const [hype, setHype] = useState(0);
  const [hypeFlash, setHypeFlash] = useState(false);
  const roomRef = useRef(null);
  const dimRef = useRef(null);
  const ringRef = useRef(null);
  const touchRef = useRef(null);

  const track = liveInfo?.track;
  const next = liveInfo?.next;
  const onAir = mode === "live" && current;
  const pct = duration ? Math.min(1, progress / duration) : 0;
  const trackIdx = track ? queue.findIndex((q) => q.id === track.id) : -1;
  const afterNext = trackIdx >= 0 ? queue[(trackIdx + 2) % queue.length] : null;

  // culoarea dominantă din cover → fundal + accent spectrum (tranziție 1.5s)
  useEffect(() => {
    if (!track?.cover_url) { setAccent(null); return; }
    dominantColor(mediaUrl(track.cover_url)).then(setAccent);
  }, [track?.cover_url]);

  useEffect(() => { setLikes(track?.likes || 0); setLiked(false); }, [track?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // închidere: Esc / buton ✕ / swipe jos pe mobil
  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/muzica");
  };
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // focus trap simplu + focus inițial pe ✕
  useEffect(() => {
    const root = roomRef.current;
    if (!root) return;
    root.querySelector("button")?.focus();
    const onTab = (e) => {
      if (e.key !== "Tab") return;
      const els = root.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
      if (!els.length) return;
      const first = els[0], lastEl = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    };
    root.addEventListener("keydown", onTab);
    return () => root.removeEventListener("keydown", onTab);
  }, []);

  const onTouchStart = (e) => { touchRef.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (touchRef.current == null) return;
    const dy = e.changedTouches[0].clientY - touchRef.current;
    if (dy > 110 && touchRef.current < 140) close();
    touchRef.current = null;
  };

  // reacțiile din chat ies DIN VINYL + umplu hype meterul
  useEffect(() => {
    const onReact = (e) => {
      const id = `rf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setFloatsRoom((f) => [...f.slice(-14), { id, emoji: e.detail?.emoji || "🔥", x: 32 + Math.random() * 36 }]);
      setTimeout(() => setFloatsRoom((f) => f.filter((x) => x.id !== id)), 2100);
      setHype((h) => Math.min(100, h + 12));
    };
    window.addEventListener("bioxic:chat-reaction", onReact);
    return () => window.removeEventListener("bioxic:chat-reaction", onReact);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHype((h) => Math.max(0, h - 3)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (hype < 100) return;
    setHype(0);
    setHypeFlash(true);
    setTimeout(() => setHypeFlash(false), 750);
    window.dispatchEvent(new CustomEvent("bioxic:inject-sys", { detail: { text: "🔥 HYPE! Sala e în flăcări!" } }));
  }, [hype]);

  // kick-ul luminează ușor fundalul
  const onKick = () => {
    const el = dimRef.current;
    if (!el) return;
    el.style.opacity = "0.42";
    clearTimeout(el.__t);
    el.__t = setTimeout(() => { el.style.opacity = "0.55"; }, 150);
  };

  const likeTrack = async () => {
    if (!track || liked) return;
    setLiked(true);
    setLikes((l) => l + 1);
    const b = Array.from({ length: 6 }, (_, i) => ({ id: `lb-${Date.now()}-${i}`, x: (Math.random() - 0.5) * 60 }));
    setBursts(b);
    setTimeout(() => setBursts([]), 1100);
    try {
      const r = await api.post(`/tracks/${track.id}/like`);
      if (typeof r.data?.likes === "number") setLikes(r.data.likes);
    } catch { /* rămâne optimist */ }
  };

  // story card 1080×1920 generat pe canvas — pentru Instagram/TikTok stories
  const shareStory = async () => {
    if (!track) return;
    try {
      const acc = accent || { r: 0, g: 240, b: 255 };
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      const bg = ctx.createLinearGradient(0, 0, 0, 1920);
      bg.addColorStop(0, "#0B1120");
      bg.addColorStop(1, "#05070C");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);
      const gl = ctx.createRadialGradient(540, 1920, 0, 540, 1920, 950);
      gl.addColorStop(0, `rgba(${acc.r},${acc.g},${acc.b},.5)`);
      gl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, 1080, 1920);
      // vinyl
      ctx.save();
      ctx.translate(540, 700);
      ctx.beginPath();
      ctx.arc(0, 0, 370, 0, 7);
      ctx.fillStyle = "#080b12";
      ctx.shadowColor = `rgba(${acc.r},${acc.g},${acc.b},.5)`;
      ctx.shadowBlur = 120;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 1.5;
      for (let r = 165; r < 360; r += 7) { ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); }
      if (track.cover_url) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = mediaUrl(track.cover_url);
          await img.decode();
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, 150, 0, 7);
          ctx.clip();
          ctx.drawImage(img, -150, -150, 300, 300);
          ctx.restore();
        } catch { /* fără cover — rămâne vinyl gol */ }
      }
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, 7);
      ctx.fillStyle = "#050505";
      ctx.fill();
      ctx.restore();
      // texte
      ctx.textAlign = "center";
      ctx.fillStyle = "#F1F5F9";
      ctx.font = "800 84px 'Plus Jakarta Sans', sans-serif";
      const words = (track.title || "BIOXIC").toUpperCase().split(" ");
      let line = "";
      let y = 1240;
      for (const w of words) {
        if (ctx.measureText(line + w).width > 920 && line) { ctx.fillText(line.trim(), 540, y); y += 96; line = ""; }
        line += w + " ";
      }
      ctx.fillText(line.trim(), 540, y);
      ctx.font = "600 34px 'JetBrains Mono', monospace";
      ctx.fillStyle = `rgb(${acc.r},${acc.g},${acc.b})`;
      ctx.fillText("ASCULT ACUM · BIOXIC.RO", 540, y + 210);
      ctx.font = "500 26px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#9AA8BF";
      ctx.fillText("LIVE 24/7 · LIMITED 2026", 540, y + 260);

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const file = new File([blob], `bioxic-${track.id}-story.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: track.title });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
      toast.success("Story card generat — gata de Instagram/TikTok!");
    } catch {
      toast.error("Nu am putut genera cardul de story.");
    }
  };

  if (!track) {
    return (
      <div className="live-room grid place-items-center" data-testid="live-room">
        <div className="text-center">
          <Loader2 size={30} className="mx-auto animate-spin text-[var(--flame)] mb-4" />
          <p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-2)]">Se deschide camera live…</p>
          <button onClick={close} className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest mt-6" data-testid="live-room-close-empty">Închide</button>
        </div>
      </div>
    );
  }

  const acc = accent || { r: 0, g: 240, b: 255 };
  const badge = typeBadge(track.title, track.genre);
  const artists = (track.artist || "BIOXIC").split(/[x×,&]|feat\.?/i).map((a) => a.trim()).filter(Boolean);

  return (
    <div
      ref={roomRef}
      className="live-room"
      role="dialog"
      aria-modal="true"
      aria-label="Camera live BIOXIC"
      data-testid="live-room"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* fundal din culorile coverului, blurat și întunecat, mișcare lentă */}
      <div className="room-blob blob-a" style={{ background: `radial-gradient(circle, rgba(${acc.r},${acc.g},${acc.b},.34), transparent 62%)`, left: "-22%", top: "-28%" }} aria-hidden="true" />
      <div className="room-blob blob-b" style={{ background: "radial-gradient(circle, rgba(56,120,190,.24), transparent 60%)", right: "-26%", bottom: "-32%" }} aria-hidden="true" />
      <div ref={dimRef} className="absolute inset-0 transition-opacity duration-300" style={{ background: "rgba(5,7,12,.55)", opacity: 0.55 }} aria-hidden="true" />
      {hypeFlash && <div className="hype-flash" data-testid="hype-flash" aria-hidden="true" />}

      <div className="relative z-10 h-full flex flex-col">
        {/* TOP: header stream + metadate */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 shrink-0">
          <button onClick={close} className="knob" aria-label="Închide camera live (Esc)" data-testid="live-room-close">
            <X size={17} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-mono-x font-semibold uppercase tracking-[0.2em] border border-[rgba(var(--live-rgb),.5)] text-[var(--live)] text-glow-live" data-testid="room-live-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" /> Live · 24/7
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-2)]" data-testid="room-listeners">
              <Users size={12} /> {listeners}
            </span>
          </div>
          <span className="stamp !py-1.5 !px-3.5 !text-[9px] !rotate-0" data-testid="room-type-badge">{badge}</span>
        </div>

        {/* corp: viewport + info | chat — pe mobil coloană flex care derulează, pe desktop grid 2 coloane */}
        <div className="flex-1 min-h-0 max-lg:flex max-lg:flex-col max-lg:overflow-y-auto chat-scroll lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* stânga: fluxul principal, pe zone verticale clare — copiii nu se comprimă (shrink-0) */}
          <div className="lg:min-h-0 lg:overflow-y-auto chat-scroll flex flex-col items-center gap-6 px-4 sm:px-8 py-4 [&>*]:shrink-0" data-lenis-prevent>
            {/* CENTER: viewport de sticlă cu vinyl + spectrum */}
            <div className="ob-card relative px-10 py-12 sm:px-14 sm:py-14" data-testid="room-viewport">
              <SpectrumVinyl cover={track.cover_url} title={track.title} accent={acc} onKick={onKick} onBpm={setBpm} />
              {/* hype meter — în interiorul viewport-ului, fără suprapuneri */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2" data-testid="hype-meter" title="Hype meter — se umple cu reacții">
                <div className="hype-bar"><i style={{ height: `${hype}%` }} /></div>
                <span className="text-[8px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">Hype</span>
              </div>
              {/* reacții care ies din vinyl */}
              {floatsRoom.map((f) => (
                <span key={f.id} className="room-float text-2xl" style={{ left: `${f.x}%` }} aria-hidden="true">{f.emoji}</span>
              ))}
            </div>

            {/* piesa, arătată altfel */}
            <div className="text-center max-w-2xl" aria-live="polite">
              <h1 key={track.id} className="font-display uppercase leading-[1.08] max-w-3xl mx-auto flex flex-wrap justify-center gap-x-[0.3em]" style={{ fontSize: "clamp(22px, 3.4vw, 38px)" }} data-testid="room-track-title">
                {track.title.split(" ").map((word, wi) => (
                  <span key={wi} className="inline-block whitespace-nowrap">
                    {word.split("").map((ch, i) => (
                      <span key={i} className="ltr-in" style={{ animationDelay: `${(wi * 4 + i) * 18}ms` }}>{ch}</span>
                    ))}
                  </span>
                ))}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3" data-testid="room-artists">
                {artists.map((a) => (
                  <span key={a} className="badge-engraved !text-[10px] border border-[var(--edge)] rounded-full px-3.5 py-1.5">{a}</span>
                ))}
              </div>
            </div>

            {/* BOTTOM: transport */}
            <div className="flex items-center gap-5" data-testid="room-transport">
              <PlayKnob pct={pct} playing={playing} loading={status === "loading"} onToggle={toggle} ringRef={ringRef} testid="room-play-button" />
              <div className="flex flex-col gap-3">
                <button onClick={stop} disabled={status === "idle" || status === "stopped"} className="knob" aria-label="Stop" data-testid="room-stop-button">
                  <Square size={14} fill="currentColor" />
                </button>
                <div className="flex items-center gap-2.5 w-36">
                  <Volume2 size={14} className="text-[var(--text-3)] shrink-0" />
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="vol w-full" aria-label="Volum" data-testid="room-volume" />
                </div>
              </div>
              <div className="font-mono-x text-[11px] text-[var(--text-2)] leading-relaxed">
                <p data-testid="room-elapsed">{onAir ? fmt(progress) : "--:--"}</p>
                <p className="text-[var(--text-3)]">-{fmt(Math.max(0, (duration || track.duration || 0) - progress))}</p>
              </div>
            </div>

            {/* ce se aude acum */}
            <p className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)]" data-testid="room-now-meta">
              Ce se aude acum{bpm ? ` · ~${bpm} BPM` : ""}{trackIdx >= 0 ? ` · Piesa #${trackIdx + 1} din rotație` : ""}
            </p>

            {/* acțiuni */}
            <div className="flex flex-wrap items-center justify-center gap-3" data-testid="room-actions">
              <button onClick={likeTrack} className={`btn-steel !h-11 !px-5 !text-[10px] relative overflow-visible ${liked ? "!border-[rgba(var(--flame-rgb),.6)]" : ""}`} data-testid="room-like-button" aria-label="Apreciază piesa">
                <Heart size={14} fill={liked ? "var(--live)" : "none"} color={liked ? "var(--live)" : "currentColor"} />
                {likes > 0 ? likes : "Apreciază"}
                {bursts.map((b) => <span key={b.id} className="like-burst-p text-sm" style={{ "--bx": `${b.x}px` }} aria-hidden="true">❤</span>)}
              </button>
              <button onClick={() => toast.info("Playlisturile personale vin în faza următoare — până atunci dă-i ❤ piesei.")} className="btn-steel !h-11 !px-5 !text-[10px]" data-testid="room-add-playlist">
                <ListPlus size={14} /> În playlist
              </button>
              <button onClick={() => navigate("/muzica")} className="btn-steel !h-11 !px-5 !text-[10px]" data-testid="room-view-track">
                <Eye size={14} /> Vezi piesa
              </button>
              <button onClick={shareStory} className="btn-flame !h-11 !px-5 !text-[10px]" data-testid="room-share-story">
                <Share2 size={14} /> Share story
              </button>
            </div>

            {/* urmează — rând subțire */}
            {next && (
              <p className="text-[10px] font-mono-x uppercase tracking-[0.18em] text-[var(--text-3)] pb-3" data-testid="room-up-next">
                Urmează: <span className="text-[var(--text)]">{next.title}</span>
                {afterNext && afterNext.id !== track.id && <> · apoi <span className="text-[var(--text-2)]">{afterNext.title}</span></>}
              </p>
            )}
          </div>

          {/* chat — coloană de sticlă pe desktop, secțiune sub player pe mobil */}
          <div className="lg:min-h-0 max-lg:h-[64vh] max-lg:shrink-0 p-3 lg:p-4 lg:pl-0" data-testid="room-chat">
            <LiveChat inRoom />
          </div>
        </div>
      </div>
    </div>
  );
}
