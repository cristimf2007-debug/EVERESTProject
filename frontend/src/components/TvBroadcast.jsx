import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, Tv } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import api, { mediaUrl } from "@/lib/api";

export const TV_STREAM_URL = "https://stream.tequilamusic.net/hls/tequila_tv.m3u8";
const LOGO_MS = 2000;   // logo-ul oficial alb, exact 2 secunde
const MAX_PROMOS = 4;   // maximum 4 clipuri în secvența de deschidere

// Playerul TV cinematic — folosit și în hero-ul de pe prima pagină, și pe /tv.
// Secvența de deschidere: logo oficial (2s) → max 4 clipuri în ordine → revine automat la streamul live.
// Performanță: streamul HLS NU se încarcă decât după ce utilizatorul apasă play.
export default function TvBroadcast() {
  const stageRef = useRef(null);
  const liveRef = useRef(null);
  const introRef = useRef(null);
  const hlsRef = useRef(null);
  const timersRef = useRef([]);
  const introDone = useRef(false);
  const mutedRef = useRef(false);
  const promosRef = useRef([]);
  const { pause: pauseRadio } = useRadio();

  const [stage, setStage] = useState("idle"); // idle | logo | promo | live
  const [promoIdx, setPromoIdx] = useState(0);
  const [promoCount, setPromoCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [err, setErr] = useState("");

  // clipurile secvenței: cele încărcate de artist, în ordinea urcării, max 4
  useEffect(() => {
    api.get("/videos")
      .then((r) => {
        const list = (r.data || []).filter((v) => v.video_url).slice().reverse().slice(0, MAX_PROMOS);
        promosRef.current = list;
        setPromoCount(list.length);
      })
      .catch(() => {});
  }, []);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const goLive = useCallback(() => {
    clearTimers();
    introRef.current?.pause();
    setStage("live");
    const v = liveRef.current;
    if (!v) return;
    if (Hls.isSupported()) {
      if (!hlsRef.current) {
        const hls = new Hls({ liveSyncDurationCount: 3, maxLiveSyncPlaybackRate: 1.5 });
        hls.on(Hls.Events.LEVEL_LOADED, () => setErr(""));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data?.fatal) return;
          if (data.details === "bufferAddCodecError") {
            setErr("Browserul nu poate decoda streamul (H.264). Deschide în Chrome, Safari sau Edge actualizat.");
            return;
          }
          setErr("Semnalul TV a picat o clipă — reîncercăm automat…");
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        });
        hls.loadSource(TV_STREAM_URL);
        hls.attachMedia(v);
        hlsRef.current = hls;
      } else {
        hlsRef.current.startLoad(-1); // salt la marginea live
      }
    } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
      if (!v.src) v.src = TV_STREAM_URL; // Safari — HLS nativ
    } else {
      setErr("Browserul tău nu suportă streamul TV.");
      return;
    }
    v.muted = mutedRef.current;
    v.play().catch(() => setErr("Apasă încă o dată pentru pornire."));
  }, []);

  const advancePromo = useCallback(() => {
    const next = promoIdx + 1;
    if (next < promosRef.current.length) setPromoIdx(next);
    else { introDone.current = true; goLive(); }
  }, [promoIdx, goLive]);

  // promo: încarcă și pornește clipul curent la schimbarea etapei/indexului
  useEffect(() => {
    if (stage !== "promo") return;
    const v = introRef.current;
    const p = promosRef.current[promoIdx];
    if (!v || !p) { introDone.current = true; goLive(); return; }
    const src = mediaUrl(p.video_url);
    if (v.dataset.src !== src) { v.src = src; v.dataset.src = src; }
    v.muted = mutedRef.current;
    v.play().catch(() => { introDone.current = true; goLive(); });
  }, [stage, promoIdx, goLive]);

  const start = useCallback(() => {
    pauseRadio(); // niciodată două surse audio simultan
    if (introDone.current) { goLive(); return; }
    setErr("");
    setStage("logo");
    timersRef.current.push(setTimeout(() => {
      if (promosRef.current.length) { setPromoIdx(0); setStage("promo"); }
      else { introDone.current = true; goLive(); }
    }, LOGO_MS));
  }, [pauseRadio, goLive]);

  const skipIntro = useCallback(() => {
    introDone.current = true;
    goLive();
  }, [goLive]);

  const toggle = useCallback(() => {
    if (stage === "idle") return start();
    if (stage === "logo") return skipIntro();
    const v = stage === "promo" ? introRef.current : liveRef.current;
    if (!v) return;
    if (v.paused) {
      if (stage === "live" && hlsRef.current) hlsRef.current.startLoad(-1);
      v.play().catch(() => setErr("Apasă încă o dată pentru pornire."));
    } else v.pause();
  }, [stage, start, skipIntro]);

  const toggleMute = () => {
    const nv = !mutedRef.current;
    mutedRef.current = nv;
    setMuted(nv);
    if (liveRef.current) liveRef.current.muted = nv;
    if (introRef.current) introRef.current.muted = nv;
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageRef.current?.requestFullscreen?.();
  };

  // radioul/piesa pornește → TV-ul tace și revine la overlay-ul de play
  useEffect(() => {
    const onAudio = () => {
      liveRef.current?.pause();
      introRef.current?.pause();
      clearTimers();
      setStage((s) => (s === "idle" ? s : "idle"));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const lv = liveRef.current;
    const iv = introRef.current;
    [lv, iv].forEach((v) => { v?.addEventListener("play", onPlay); v?.addEventListener("pause", onPause); });
    window.addEventListener("bioxic:audio-play", onAudio);
    return () => {
      [lv, iv].forEach((v) => { v?.removeEventListener("play", onPlay); v?.removeEventListener("pause", onPause); });
      window.removeEventListener("bioxic:audio-play", onAudio);
      clearTimers();
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  const activePromo = promosRef.current[promoIdx];

  return (
    <div className="tv-shell" data-testid="tv-stage" ref={stageRef}>
      <div className="tv-ambient" aria-hidden="true" />
      <div className="tv-screen">
        {/* streamul live HLS */}
        <video ref={liveRef} className={`tv-fade ${stage === "live" ? "" : "tv-hidden"}`} playsInline data-testid="tv-video" />
        {/* clipurile din secvența de deschidere */}
        <video
          ref={introRef}
          className={`tv-fade ${stage === "promo" ? "" : "tv-hidden"}`}
          playsInline
          data-testid="tv-intro-video"
          onEnded={advancePromo}
          onError={advancePromo}
        />

        {/* overlay idle — poster artist + play mare */}
        {stage === "idle" && (
          <button className="tv-bigplay" onClick={toggle} aria-label="Pornește TV" data-testid="tv-bigplay">
            <img src="/artist.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25" style={{ maskImage: "linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)" }} />
            <span className="tv-bigplay-btn relative"><Play size={32} fill="currentColor" className="ml-1.5" /></span>
            <span className="absolute bottom-8 left-0 right-0 font-mono-x text-[10px] uppercase tracking-[0.3em] text-[var(--text-2)]">
              Apasă play · intri direct în emisie
            </span>
          </button>
        )}

        {/* etapa 1 — logo-ul oficial alb, exact 2 secunde */}
        {stage === "logo" && (
          <div className="tv-logo-stage" data-testid="tv-logo-intro">
            <img src="/logo.png" alt="BIOXIC" />
            <span className="tv-logo-bar" aria-hidden="true"><i /></span>
          </div>
        )}

        {/* etapa 2 — clipurile, cu chip de etapă și skip elegant */}
        {stage === "promo" && (
          <>
            <span className="tv-chip absolute top-3.5 left-3.5 z-[6] max-w-[70%]" data-testid="tv-promo-chip">
                Intro {promoIdx + 1}/{promoCount}{activePromo?.title ? ` · ${activePromo.title}` : ""}
            </span>
            <button
              onClick={skipIntro}
              className="tv-chip absolute top-3.5 right-3.5 z-[8] hover:text-[var(--text)] hover:border-[rgba(var(--flame-rgb),.5)] transition-colors cursor-pointer"
              data-testid="tv-intro-skip"
              aria-label="Sari direct la emisia live"
            >
              Sari la LIVE <SkipForward size={12} />
            </button>
          </>
        )}

        {/* badge LIVE — doar când streamul chiar rulează */}
        {stage === "live" && playing && (
          <span className="live-badge absolute top-4 left-4 z-[6]" data-testid="tv-live-badge">
            <span className="live-dot" /> În direct
          </span>
        )}

        {err && (
          <p className="tv-chip absolute top-3.5 left-1/2 -translate-x-1/2 z-[8] !text-[var(--gold)] !border-[rgba(255,194,75,.4)]" data-testid="tv-error">
            {err}
          </p>
        )}

        {/* bara de control din sticlă — plutitoare, apare la hover / când e pe pauză / pe touch */}
        {stage !== "logo" && (
          <div className={`tv-controls ${!playing ? "tv-paused" : ""}`} data-testid="tv-controls">
            <button onClick={toggle} className="knob" style={{ color: "var(--flame)" }} aria-label={playing ? "Pauză TV" : "Pornește TV"} data-testid="tv-toggle">
              {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={toggleMute} className="knob knob-sm" aria-label={muted ? "Cu sunet" : "Fără sunet"} data-testid="tv-mute">
              {muted ? <VolumeX /> : <Volume2 />}
            </button>
            <span className="hidden sm:flex items-center gap-2 font-mono-x text-[10px] uppercase tracking-widest text-[var(--text-3)]">
              <Tv size={12} /> {stage === "promo" ? `Intro ${promoIdx + 1}/${promoCount}` : "1080p · AAC · live edge"}
            </span>
            <button onClick={fullscreen} className="knob knob-sm ml-auto" aria-label="Tot ecranul" data-testid="tv-fullscreen">
              <Maximize />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
