import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, Tv } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import api, { mediaUrl } from "@/lib/api";

export const TV_STREAM_URL = "https://stream.tequilamusic.net/hls/tequila_tv.m3u8";
const LOGO_MS = 2000;   // logo-ul oficial alb, exact 2 secunde
const MAX_PROMOS = 4;   // maximum 4 clipuri în secvența de deschidere

/* ============================================================
   SINGLETON TV — nodul video trăiește la nivel de modul și este
   mutat între pagini (appendChild NU oprește redarea), deci
   transmisia live continuă când schimbi pagina sau revii pe /tv.
   Secvența: logo oficial 2s → max 4 clipuri în ordine → live HLS.
   HLS NU se încarcă decât după ce utilizatorul apasă play.
   ============================================================ */
const TV = {
  node: null, hls: null, promos: null, timers: [],
  state: { stage: "idle", playing: false, muted: false, promoIdx: 0, promoCount: 0, err: "" },
  listeners: new Set(),
  radioPause: null, // injectat de componentă (pause-ul radioului)
};

function emit() { TV.listeners.forEach((f) => f()); }
function setTV(patch) { Object.assign(TV.state, patch); emit(); }

function getPark() {
  let p = document.getElementById("tv-park");
  if (!p) {
    p = document.createElement("div");
    p.id = "tv-park";
    p.style.cssText = "position:fixed;left:-99999px;top:0;width:16px;height:9px;overflow:hidden;pointer-events:none;";
    document.body.appendChild(p);
  }
  return p;
}

function liveVideo() { return TV.node?.querySelector("video[data-role='live']"); }
function introVideo() { return TV.node?.querySelector("video[data-role='intro']"); }

function goLive() {
  TV.timers.forEach(clearTimeout); TV.timers = [];
  introVideo()?.pause();
  setTV({ stage: "live", err: "" });
  const v = liveVideo();
  if (!v) return;
  if (Hls.isSupported()) {
    if (!TV.hls) {
      const hls = new Hls({ liveSyncDurationCount: 3, maxLiveSyncPlaybackRate: 1.5 });
      hls.on(Hls.Events.LEVEL_LOADED, () => setTV({ err: "" }));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data?.fatal) return;
        if (data.details === "bufferAddCodecError") {
          setTV({ err: "Browserul nu poate decoda streamul (H.264). Deschide în Chrome, Safari sau Edge actualizat." });
          return;
        }
        setTV({ err: "Semnalul TV a picat o clipă — reîncercăm automat…" });
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
      hls.loadSource(TV_STREAM_URL);
      hls.attachMedia(v);
      TV.hls = hls;
    } else {
      TV.hls.startLoad(-1); // salt la marginea live
    }
  } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
    if (!v.src) v.src = TV_STREAM_URL; // Safari — HLS nativ
  } else {
    setTV({ err: "Browserul tău nu suportă streamul TV." });
    return;
  }
  v.muted = TV.state.muted;
  v.play().catch(() => setTV({ err: "Apasă încă o dată pentru pornire." }));
}

function advancePromo() {
  const next = TV.state.promoIdx + 1;
  if (next < (TV.promos?.length || 0)) {
    setTV({ promoIdx: next });
    playPromo();
  } else {
    TV.state.introDone = true;
    goLive();
  }
}

function playPromo() {
  const v = introVideo();
  const p = TV.promos?.[TV.state.promoIdx];
  if (!v || !p) { TV.state.introDone = true; goLive(); return; }
  const src = mediaUrl(p.video_url);
  if (v.dataset.src !== src) { v.src = src; v.dataset.src = src; }
  v.muted = TV.state.muted;
  v.play().catch(() => { TV.state.introDone = true; goLive(); });
}

function startTV() {
  TV.radioPause?.(); // niciodată două surse audio simultan
  if (TV.state.introDone) { goLive(); return; }
  setTV({ stage: "logo", err: "" });
  TV.timers.push(setTimeout(() => {
    if (TV.promos?.length) { setTV({ stage: "promo", promoIdx: 0 }); playPromo(); }
    else { TV.state.introDone = true; goLive(); }
  }, LOGO_MS));
}

function skipIntro() {
  TV.state.introDone = true;
  goLive();
}

function toggleTV() {
  const st = TV.state.stage;
  if (st === "idle") return startTV();
  if (st === "logo") return skipIntro();
  const v = st === "promo" ? introVideo() : liveVideo();
  if (!v) return;
  if (v.paused) {
    if (st === "live" && TV.hls) TV.hls.startLoad(-1);
    v.play().catch(() => setTV({ err: "Apasă încă o dată pentru pornire." }));
  } else v.pause();
}

function toggleMuteTV() {
  const nv = !TV.state.muted;
  setTV({ muted: nv });
  const lv = liveVideo(); const iv = introVideo();
  if (lv) lv.muted = nv;
  if (iv) iv.muted = nv;
}

// creează nodul persistent o singură dată
function ensureNode() {
  if (TV.node) return TV.node;
  const node = document.createElement("div");
  node.style.cssText = "position:absolute;inset:0;";
  const lv = document.createElement("video");
  lv.dataset.role = "live";
  lv.playsInline = true;
  lv.setAttribute("data-testid", "tv-video");
  const iv = document.createElement("video");
  iv.dataset.role = "intro";
  iv.playsInline = true;
  iv.setAttribute("data-testid", "tv-intro-video");
  node.appendChild(lv);
  node.appendChild(iv);
  // starea „playing" se derivează din video-ul activ — imună la ordinea evenimentelor play/pause
  const syncPlaying = () => {
    const st = TV.state.stage;
    const v = st === "promo" ? iv : st === "live" ? lv : null;
    setTV({ playing: v ? !v.paused : false });
  };
  TV.syncPlaying = syncPlaying;
  [lv, iv].forEach((v) => { v.addEventListener("play", syncPlaying); v.addEventListener("pause", syncPlaying); });
  iv.addEventListener("ended", advancePromo);
  iv.addEventListener("error", advancePromo);
  // radioul/piesa pornește → TV-ul tace și revine la overlay-ul de play
  window.addEventListener("bioxic:audio-play", () => {
    lv.pause(); iv.pause();
    TV.timers.forEach(clearTimeout); TV.timers = [];
    setTV({ stage: "idle" });
  });
  TV.node = node;
  // clipurile secvenței: cele încărcate de artist, în ordinea urcării, max 4
  api.get("/videos")
    .then((r) => {
      TV.promos = (r.data || []).filter((v) => v.video_url).slice().reverse().slice(0, MAX_PROMOS);
      setTV({ promoCount: TV.promos.length });
    })
    .catch(() => { TV.promos = []; });
  return node;
}

// Playerul TV cinematic — aceeași instanță pe homepage și /tv (redare continuă la navigare)
export default function TvBroadcast() {
  const hostRef = useRef(null);
  const shellRef = useRef(null);
  const { pause: pauseRadio } = useRadio();
  const [st, setSt] = useState(TV.state);

  useEffect(() => {
    TV.radioPause = pauseRadio;
    const node = ensureNode();
    hostRef.current?.appendChild(node); // adoptare: mutarea NU oprește redarea
    const sub = () => setSt({ ...TV.state });
    TV.listeners.add(sub);
    setSt({ ...TV.state });
    TV.syncPlaying?.(); // realiniază starea cu realitatea elementului după adoptare
    // vizibilitatea videourilor după etapă
    const lv = liveVideo(); const iv = introVideo();
    [lv, iv].forEach((v) => v?.classList.add("tv-fade"));
    return () => {
      TV.listeners.delete(sub);
      // parcăm nodul — redarea continuă în fundal, nu o distrugem
      if (node.parentNode) getPark().appendChild(node);
    };
  }, [pauseRadio]);

  // mascarea videourilor după etapă
  useEffect(() => {
    const lv = liveVideo(); const iv = introVideo();
    if (lv) lv.classList.toggle("tv-hidden", st.stage !== "live");
    if (iv) iv.classList.toggle("tv-hidden", st.stage !== "promo");
  }, [st.stage]);

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shellRef.current?.requestFullscreen?.();
  };

  const activePromo = TV.promos?.[st.promoIdx];

  return (
    <div className="tv-shell" data-testid="tv-stage" ref={shellRef}>
      <div className="tv-ambient" aria-hidden="true" />
      <div className="tv-screen">
        {/* aici se montează nodul singleton cu cele două video-uri */}
        <div ref={hostRef} className="absolute inset-0" data-testid="tv-host" />

        {/* overlay idle — poster artist + play mare */}
        {st.stage === "idle" && (
          <button className="tv-bigplay" onClick={toggleTV} aria-label="Pornește TV" data-testid="tv-bigplay">
            <img src="/artist.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25" style={{ maskImage: "linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)" }} />
            <span className="tv-bigplay-btn relative"><Play size={32} fill="currentColor" className="ml-1.5" /></span>
            <span className="absolute bottom-8 left-0 right-0 font-mono-x text-[10px] uppercase tracking-[0.3em] text-[var(--text-2)]">
              Apasă play · intri direct în emisie
            </span>
          </button>
        )}

        {/* etapa 1 — logo-ul oficial alb, exact 2 secunde */}
        {st.stage === "logo" && (
          <div className="tv-logo-stage" data-testid="tv-logo-intro">
            <img src="/logo.png" alt="BIOXIC" />
            <span className="tv-logo-bar" aria-hidden="true"><i /></span>
          </div>
        )}

        {/* etapa 2 — clipurile, cu chip de etapă și skip elegant */}
        {st.stage === "promo" && (
          <>
            <span className="tv-chip absolute top-3.5 left-3.5 z-[6] max-w-[70%]" data-testid="tv-promo-chip">
              Intro {st.promoIdx + 1}/{st.promoCount}{activePromo?.title ? ` · ${activePromo.title}` : ""}
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
        {st.stage === "live" && st.playing && (
          <span className="live-badge absolute top-4 left-4 z-[6]" data-testid="tv-live-badge">
            <span className="live-dot" /> În direct
          </span>
        )}

        {st.err && (
          <p className="tv-chip absolute top-3.5 left-1/2 -translate-x-1/2 z-[8] !text-[var(--gold)] !border-[rgba(255,194,75,.4)]" data-testid="tv-error">
            {st.err}
          </p>
        )}

        {/* bara de control din sticlă — plutitoare, apare la hover / când e pe pauză / pe touch */}
        {st.stage !== "logo" && (
          <div className={`tv-controls ${!st.playing ? "tv-paused" : ""}`} data-testid="tv-controls">
            <button onClick={toggleTV} className="knob" style={{ color: "var(--flame)" }} aria-label={st.playing ? "Pauză TV" : "Pornește TV"} data-testid="tv-toggle">
              {st.playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={toggleMuteTV} className="knob knob-sm" aria-label={st.muted ? "Cu sunet" : "Fără sunet"} data-testid="tv-mute">
              {st.muted ? <VolumeX /> : <Volume2 />}
            </button>
            <span className="hidden sm:flex items-center gap-2 font-mono-x text-[10px] uppercase tracking-widest text-[var(--text-3)]">
              <Tv size={12} /> {st.stage === "promo" ? `Intro ${st.promoIdx + 1}/${st.promoCount}` : "1080p · AAC · live edge"}
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
