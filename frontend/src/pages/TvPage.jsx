import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Tv, Radio, Users, Clock } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import { useRadio } from "@/context/RadioContext";
import api from "@/lib/api";

const STREAM_URL = "https://stream.tequilamusic.net/hls/tequila_tv.m3u8";

// Pagina TV — stream HLS live 24/7 + chatul comunității alături
export default function TvPage() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const { pause: pauseRadio, listeners } = useRadio();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [err, setErr] = useState("");
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    api.get("/tv/schedule").then((r) => setSchedule(r.data || [])).catch(() => {});
  }, []);

  // următoarea emisiune din ziua curentă (prima cu ora >= acum; altfel prima din program)
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const nextIdx = schedule.length
    ? Math.max(0, schedule.findIndex((s) => toMin(s.time) >= nowMin))
    : -1;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ liveSyncDurationCount: 3, maxLiveSyncPlaybackRate: 1.5 });
      hls.on(Hls.Events.LEVEL_LOADED, () => setErr(""));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data?.fatal) return;
        if (data.details === "bufferAddCodecError") {
          // browser fără codecuri H.264/AAC (rar — browsere vechi sau builduri headless)
          setErr("Browserul nu poate decoda streamul (H.264). Deschide în Chrome, Safari sau Edge actualizat.");
          return;
        }
        setErr("Semnalul TV a picat o clipă — reîncercăm automat…");
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = STREAM_URL; // Safari — HLS nativ
    } else {
      setErr("Browserul tău nu suportă streamul TV.");
    }
    const onPlay = () => { setPlaying(true); setErr(""); pauseRadio(); };
    const onPause = () => setPlaying(false);
    const onAudio = () => video.pause(); // radioul pornește → TV-ul tace
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    window.addEventListener("bioxic:audio-play", onAudio);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      window.removeEventListener("bioxic:audio-play", onAudio);
      hls?.destroy();
    };
  }, [pauseRadio]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (hlsRef.current) hlsRef.current.startLoad(-1); // salt la marginea live
      v.play().catch(() => setErr("Apasă încă o dată pentru pornire."));
    } else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = () => {
    const el = videoRef.current?.closest("[data-testid='tv-stage']");
    if (document.fullscreenElement) document.exitFullscreen();
    else el?.requestFullscreen?.();
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8" data-testid="tv-page">
      <header className="rv flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="badge-engraved">Televiziune · Non-stop</p>
          <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight mt-2">
            Bioxic <span className="text-[var(--flame)]">TV</span>
          </h2>
          <p className="text-[var(--text-2)] text-sm mt-3 max-w-xl">
            Manele video non-stop, Full HD — cu chatul comunității alături. Radioul tace automat cât te uiți.
          </p>
        </div>
        <span className="hdr-live !px-4 !py-2" data-testid="tv-live-badge">
          <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: "var(--live)" }} />
          LIVE TV
        </span>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-5 mt-8 rv">
        {/* playerul */}
        <section>
          <div className="ob-card !p-0 overflow-hidden relative group" data-testid="tv-stage">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                playsInline
                data-testid="tv-video"
              />
              {/* overlay play mare — fără autoplay, pornește doar la click */}
              {!playing && (
                <button
                  onClick={toggle}
                  className="absolute inset-0 grid place-items-center bg-black/55 transition-colors hover:bg-black/45"
                  aria-label="Pornește TV"
                  data-testid="tv-big-play"
                >
                  <span className="knob !w-20 !h-20" style={{ color: "var(--flame)" }}>
                    <Play size={30} fill="currentColor" className="ml-1" />
                  </span>
                  <span className="absolute bottom-6 font-mono-x text-[10px] uppercase tracking-[0.3em] text-[var(--text-2)]">
                    Apasă play · direct la marginea live
                  </span>
                </button>
              )}
              {err && (
                <p className="absolute top-3 left-1/2 -translate-x-1/2 font-mono-x text-[10px] uppercase tracking-widest text-[var(--accent-hi)] bg-black/70 rounded-full px-4 py-1.5" data-testid="tv-error">
                  {err}
                </p>
              )}
            </div>
            {/* controale */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-t border-[var(--edge)]">
              <button onClick={toggle} className="knob" style={{ color: "var(--flame)" }} aria-label={playing ? "Pauză TV" : "Pornește TV"} data-testid="tv-toggle">
                {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={toggleMute} className="knob knob-sm" aria-label={muted ? "Cu sunet" : "Fără sunet"} data-testid="tv-mute">
                {muted ? <VolumeX /> : <Volume2 />}
              </button>
              <span className="hidden sm:flex items-center gap-2 font-mono-x text-[10px] uppercase tracking-widest text-[var(--text-3)]">
                <Tv size={12} /> 1080p · 50fps · AAC 320k
              </span>
              <button onClick={fullscreen} className="knob knob-sm ml-auto" aria-label="Tot ecranul" data-testid="tv-fullscreen">
                <Maximize />
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 mt-4 flex items-center gap-3 text-[11px] text-[var(--text-2)]" data-testid="tv-note">
            <Radio size={14} className="text-[var(--flame)] shrink-0" />
            <span>
              Când apeși play aici, radioul se oprește singur — niciodată două surse deodată.
              Vrei doar muzică? Pagina <a href="/muzica" className="text-[var(--flame)] underline underline-offset-2">Muzică & Radio</a> rămâne sursa principală.
            </span>
          </div>
        </section>

        {/* chatul live al comunității */}
        <aside className="min-h-[520px] lg:min-h-0" data-testid="tv-chat">
          <div className="ob-card h-full !p-3 flex flex-col">
            <p className="flex items-center gap-2 font-mono-x text-[10px] uppercase tracking-[0.2em] text-[var(--text-3)] px-1 pb-2">
              <Users size={12} /> Chat live{listeners > 0 ? ` · ${listeners} online` : ""}
            </p>
            <div className="flex-1 min-h-0">
              <LiveChat inRoom />
            </div>
          </div>
        </aside>
      </div>

      {/* programul zilei — editabil din panoul admin */}
      {schedule.length > 0 && (
        <section className="mt-10 rv" data-testid="tv-schedule">
          <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight flex items-center gap-2.5">
            <Clock size={18} className="text-[var(--flame)]" /> Programul de azi
          </h3>
          <div className="mt-4 space-y-2">
            {schedule.map((s, i) => {
              const isNext = i === nextIdx;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 rounded-2xl border px-4 sm:px-5 py-3.5 transition-colors ${
                    isNext ? "border-[rgba(var(--flame-rgb),.5)] bg-[rgba(var(--flame-rgb),.06)]" : "border-[var(--edge)] bg-black/20"
                  }`}
                  data-testid={`tv-schedule-${s.id}`}
                >
                  <span className={`font-mono-x text-sm font-bold tabular-nums ${isNext ? "text-[var(--flame)]" : "text-[var(--text-2)]"}`}>
                    {s.time}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{s.title}</span>
                    {s.note && <span className="block text-[11px] text-[var(--text-3)] truncate mt-0.5">{s.note}</span>}
                  </span>
                  {isNext && (
                    <span className="hdr-badge vip shrink-0" data-testid="tv-schedule-next">Urmează</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-3">
            Orele sunt orientative · premierile se aud întâi aici
          </p>
        </section>
      )}
    </div>
  );
}
