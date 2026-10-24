import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture2, Gauge, RotateCcw } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import api, { mediaUrl } from "@/lib/api";

const fmt = (s) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Player video custom, în tema Halloween — tastatură completă, resume, ambient glow
export default function VideoPlayer({ video, onEnded, seekApi }) {
  const { pause: pauseRadio } = useRadio();
  const wrapRef = useRef(null);
  const vidRef = useRef(null);
  const glowRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [vol, setVol] = useState(() => parseFloat(localStorage.getItem("bioxic_vid_vol") ?? "0.9"));
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [full, setFull] = useState(false);
  const [resumeAt, setResumeAt] = useState(null);
  const [showResume, setShowResume] = useState(false);
  const [seekFlash, setSeekFlash] = useState(null); // "-10s" | "+10s"

  const posKey = `bioxic_vid_pos_${video.id}`;

  // API pentru seek din exterior (comentarii cu timestamp, capitole)
  useEffect(() => {
    if (seekApi) {
      seekApi.current = {
        seek: (sec) => { const v = vidRef.current; if (v) { v.currentTime = sec; v.play().catch(() => {}); } },
        time: () => vidRef.current?.currentTime || 0,
      };
    }
  }, [seekApi]);

  // la play → pauză la radio (o singură sursă audio) + numărăm vizualizarea
  const onPlay = useCallback(() => {
    pauseRadio();
    setPlaying(true);
    api.post(`/videos/${video.id}/view`).catch(() => {});
  }, [pauseRadio, video.id]);

  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    v.volume = vol;
    const saved = parseFloat(localStorage.getItem(posKey) || "0");
    const onMeta = () => {
      setDur(v.duration || 0);
      if (saved > 10 && saved < (v.duration || 0) - 10) {
        setResumeAt(saved);
        setShowResume(true);
      }
    };
    const onTime = () => {
      setTime(v.currentTime);
      if (v.duration) {
        const b = v.buffered;
        if (b.length) setBuffered(b.end(b.length - 1) / v.duration);
      }
      if (v.currentTime > 5) localStorage.setItem(posKey, String(Math.floor(v.currentTime)));
    };
    const onEnd = () => {
      localStorage.removeItem(posKey);
      setPlaying(false);
      onEnded?.();
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, [posKey, onEnded]);

  // glow ambient portocaliu sub player (pulsează ușor cât cântă)
  useEffect(() => {
    if (glowRef.current) glowRef.current.style.opacity = playing ? "1" : "0.45";
  }, [playing]);

  const toggle = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); } else { v.pause(); setPlaying(false); }
  }, []);

  const seekBy = useCallback((delta, flash) => {
    const v = vidRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta));
    if (flash) {
      setSeekFlash(flash);
      setTimeout(() => setSeekFlash(null), 500);
    }
  }, []);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const pip = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else v.requestPictureInPicture?.().catch(() => {});
  }, []);

  // scurtături tastatură
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const v = vidRef.current;
      if (!v) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") { e.preventDefault(); toggle(); }
      else if (k === "j") seekBy(-10, "-10s");
      else if (k === "l") seekBy(10, "+10s");
      else if (k === "arrowleft") seekBy(-5);
      else if (k === "arrowright") seekBy(5);
      else if (k === "arrowup") { e.preventDefault(); const nv = Math.min(1, v.volume + 0.1); v.volume = nv; setVol(nv); setMuted(false); }
      else if (k === "arrowdown") { e.preventDefault(); const nv = Math.max(0, v.volume - 0.1); v.volume = nv; setVol(nv); }
      else if (k === "m") { v.muted = !v.muted; setMuted(v.muted); }
      else if (k === "f") toggleFull();
      else if (/^[0-9]$/.test(k) && v.duration) v.currentTime = (parseInt(k) / 10) * v.duration;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seekBy, toggleFull]);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // dublu-tap pe mobil: stânga -10s, dreapta +10s
  const lastTap = useRef({ t: 0, x: 0 });
  const onTap = (e) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX ?? 0) - rect.left;
    if (now - lastTap.current.t < 320) {
      seekBy(x < rect.width / 2 ? -10 : 10, x < rect.width / 2 ? "-10s" : "+10s");
      lastTap.current = { t: 0, x: 0 };
    } else {
      lastTap.current = { t: now, x };
      setTimeout(() => { if (lastTap.current.t === now) { /* single tap → toggle */ toggle(); } }, 330);
    }
  };

  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div ref={wrapRef} className={`relative ${full ? "bg-black" : ""}`} data-testid="video-player">
      {/* glow ambient */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute -inset-6 rounded-3xl pointer-events-none transition-opacity duration-700"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(232,115,26,.22), transparent 70%)", filter: "blur(10px)" }}
      />
      <div className="relative rounded-2xl overflow-hidden border border-[var(--line)] bg-black group/vp">
        <video
          ref={vidRef}
          src={mediaUrl(video.video_url)}
          poster={mediaUrl(video.thumb_url) || undefined}
          preload="metadata"
          playsInline
          controlsList="nodownload"
          className="w-full aspect-video"
          data-testid="video-element"
          onPlay={onPlay}
          onPause={() => setPlaying(false)}
          onClick={onTap}
        />
        {/* flash ±10s */}
        {seekFlash && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none" data-testid="seek-flash">
            <span className="font-display text-2xl text-[var(--accent)] bg-black/60 rounded-full px-5 py-2 animate-ping-once" style={{ animation: "msg-in .5s ease-out both" }}>{seekFlash}</span>
          </div>
        )}
        {/* continuu de la... */}
        {showResume && resumeAt && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3 glass rounded-xl px-4 py-2.5 z-10" data-testid="resume-bar">
            <span className="text-xs text-[var(--frost)]">Continuă de la <b className="text-[var(--accent)]">{fmt(resumeAt)}</b>?</span>
            <div className="flex gap-2">
              <button className="btn-x gold !py-1.5 !px-4 text-[10px] font-bold uppercase tracking-widest" data-testid="resume-yes"
                onClick={() => { vidRef.current.currentTime = resumeAt; setShowResume(false); vidRef.current.play().catch(() => {}); }}>
                Da
              </button>
              <button className="btn-ghost rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest" data-testid="resume-no" onClick={() => { localStorage.removeItem(posKey); setShowResume(false); }}>
                De la început
              </button>
            </div>
          </div>
        )}
        {/* controale */}
        <div className="absolute bottom-0 inset-x-0 px-3 sm:px-4 pb-2.5 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/vp:opacity-100 focus-within:opacity-100 transition-opacity duration-200" data-testid="video-controls">
          {/* progres cu buffering */}
          <div
            className="relative h-1.5 w-full bg-white/15 rounded-full cursor-pointer mb-3 group/bar"
            data-testid="video-progress"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
              if (dur) vidRef.current.currentTime = ratio * dur;
            }}
          >
            <div className="absolute inset-y-0 left-0 bg-white/25 rounded-full" style={{ width: `${buffered * 100}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: "var(--site-accent)", boxShadow: "0 0 10px rgba(232,115,26,.7)" }} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggle} aria-label={playing ? "Pauză" : "Redă"} data-testid="video-play-pause"
              className="grid w-10 h-10 rounded-full place-items-center text-white hover:text-[var(--accent)] transition-colors">
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <span className="text-[11px] font-mono-x text-white/85 tabular-nums" data-testid="video-time">{fmt(time)} / {fmt(dur)}</span>
            <div className="flex-1" />
            {/* viteză */}
            <div className="relative group/speed">
              <button className="flex items-center gap-1 text-[11px] font-mono-x text-white/85 hover:text-[var(--accent)] transition-colors px-2 py-1.5" data-testid="video-speed" aria-label="Viteză">
                <Gauge size={14} /> {speed}x
              </button>
              <div className="absolute bottom-9 right-0 hidden group-hover/speed:grid glass rounded-xl p-1.5 gap-0.5 w-24 z-20" data-testid="video-speed-menu">
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => { vidRef.current.playbackRate = s; setSpeed(s); }}
                    className={`text-[11px] font-mono-x rounded-lg px-2.5 py-1.5 text-left transition-colors ${s === speed ? "text-[var(--accent)] bg-white/5" : "text-white/80 hover:bg-white/5"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { const v = vidRef.current; v.muted = !v.muted; setMuted(v.muted); }} aria-label="Mute" data-testid="video-mute"
              className="text-white/85 hover:text-[var(--accent)] transition-colors">
              {muted || vol === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} aria-label="Volum" data-testid="video-volume"
              onChange={(e) => { const nv = parseFloat(e.target.value); vidRef.current.volume = nv; setVol(nv); setMuted(false); localStorage.setItem("bioxic_vid_vol", String(nv)); }}
              className="vol w-20 hidden sm:block" />
            <button onClick={pip} aria-label="Picture in picture" data-testid="video-pip" className="text-white/85 hover:text-[var(--accent)] transition-colors hidden sm:block">
              <PictureInPicture2 size={17} />
            </button>
            <button onClick={toggleFull} aria-label="Fullscreen" data-testid="video-fullscreen" className="text-white/85 hover:text-[var(--accent)] transition-colors">
              {full ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
