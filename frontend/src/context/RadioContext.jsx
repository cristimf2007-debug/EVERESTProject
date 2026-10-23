import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api, { mediaUrl, getSid } from "@/lib/api";

const RadioContext = createContext(null);
const DRIFT = 3; // secunde — prag de corecție (din brief)
const SEEK_COOLDOWN = 15000; // după o corecție de drift, pauză de corecții (evită re-buffering în lanț)

// link-urile audio sunt semnate și expiră (anti-furt); cerem link proaspăt la fiecare piesă
async function signSrc(audioUrl) {
  try {
    const r = await api.get(`/media/sign?u=${encodeURIComponent(audioUrl)}`);
    return mediaUrl(r.data.url);
  } catch {
    return mediaUrl(audioUrl);
  }
}

// UN SINGUR controller audio pentru tot site-ul: radio live + redare on-demand
export function RadioProvider({ children }) {
  const audioRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const lastSeekRef = useRef(0);
  const modeRef = useRef("live");
  const statusRef = useRef("idle");
  const currentRef = useRef(null);
  const resignRef = useRef(0);
  const offsetRef = useRef(0);        // diferența de ceas server − client (ms)
  const lastPosRef = useRef(null);    // { position, at } — ultima poziție cunoscută de la server

  const [mode, setModeState] = useState("live"); // "live" | "track"
  const [status, setStatusState] = useState("idle"); // idle | loading | playing | paused | stopped | error
  const [liveInfo, setLiveInfo] = useState(null);
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]); // piesele pentru redare on-demand (ordinea din /piese)
  const [trackIdx, setTrackIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [listeners, setListeners] = useState(0);

  const setStatus = (s) => { statusRef.current = s; setStatusState(s); };
  const setMode = (m) => { modeRef.current = m; setModeState(m); };
  const playing = status === "playing";

  // Încarcă o sursă NOUĂ o singură dată (niciodată la re-render); link audio semnat
  const loadSrc = (track, position = 0) => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    pendingSeekRef.current = position;
    setStatus("loading");
    signSrc(track.audio_url).then((src) => {
      audio.setAttribute("data-src", src);
      audio.setAttribute("data-track", track.id);
      audio.src = src;
      audio.load();
    });
  };

  // poziția așteptată calculată LOCAL între poll-uri (cu offset de ceas), fără cereri în plus
  const expectedPosition = () => {
    const lp = lastPosRef.current;
    if (!lp) return null;
    return lp.position + (Date.now() - lp.at) / 1000;
  };

  // Sincronizare cu radioul: la 12s. NU reîncarcă sursa dacă e aceeași piesă.
  const syncLive = useCallback(async () => {
    try {
      const r = await api.get("/radio/now");
      const data = r.data;
      setLiveInfo(data);
      if (typeof data.listeners === "number") setListeners(data.listeners);
      // offset de ceas: serverNow − clientNow
      if (data.server_time) {
        offsetRef.current = new Date(data.server_time).getTime() - Date.now();
      }
      if (typeof data.position === "number") {
        lastPosRef.current = { position: data.position, at: Date.now() };
      }
      if (modeRef.current !== "live") return;
      if (!data.track) { setCurrent(null); return; }
      setCurrent(data.track);
      currentRef.current = data.track;
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.getAttribute("data-track") !== data.track.id) {
        // piesă nouă la radio — schimbă sursa o singură dată
        loadSrc(data.track, data.position);
        if (statusRef.current === "playing") audio.play().catch(() => setStatus("error"));
      } else if (audio.ended && (statusRef.current === "playing" || statusRef.current === "loading")) {
        // piesa live s-a terminat natural → serverul a trecut mai departe; ne aliniem fără cooldown
        lastSeekRef.current = Date.now();
        try { audio.currentTime = data.position; } catch { /* încă se încarcă */ }
        audio.play().catch(() => {});
      } else {
        // drift calculat pe poziția așteptată LOCALĂ (nu forțăm seek la fiecare poll)
        const expected = expectedPosition();
        if (
          expected != null &&
          Math.abs(audio.currentTime - expected) > DRIFT &&
          !audio.seeking && audio.readyState >= 3 && !audio.ended &&
          Date.now() - lastSeekRef.current > SEEK_COOLDOWN
        ) {
          lastSeekRef.current = Date.now();
          audio.currentTime = expected;
        }
      }
    } catch { /* reîncearcă la ciclul următor */ }
  }, []);

  useEffect(() => {
    syncLive();
    const t = setInterval(syncLive, 12000);
    return () => clearInterval(t);
  }, [syncLive]);

  // coada pentru redare on-demand
  useEffect(() => {
    api.get("/tracks").then((r) => setQueue(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const beat = () => api.post("/radio/heartbeat", { sid: getSid() })
      .then((r) => setListeners(r.data.listeners)).catch(() => {});
    beat();
    const t = setInterval(beat, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  // ---------- TRANSPORT ----------

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (modeRef.current === "live") {
      setStatus("loading");
      // revenire după stop/pauză → ne realiniem la secunda live, apoi pornim
      syncLive().then(() => {
        const a = audioRef.current;
        if (!a) return;
        setStatus("playing");
        a.play().catch(() => setStatus("error"));
      });
    } else {
      setStatus("playing");
      audio.play().catch(() => setStatus("error"));
    }
  }, [current, syncLive]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (modeRef.current === "track") {
      try { audio.currentTime = 0; } catch { /* media încă se încarcă */ }
    }
    setProgress(0);
    setStatus("stopped");
  }, []);

  const toggle = useCallback(() => {
    if (statusRef.current === "playing") pause();
    else play();
  }, [pause, play]);

  const playTrack = useCallback((t, list) => {
    const q = list || queue;
    setMode("track");
    setCurrent(t);
    currentRef.current = t;
    setTrackIdx(q.findIndex((x) => x.id === t.id));
    loadSrc(t, 0);
    setStatus("playing");
    api.post(`/tracks/${t.id}/play`).catch(() => {});
  }, [queue]);

  const next = useCallback(() => {
    if (modeRef.current !== "track" || trackIdx < 0) return;
    const nxt = queue[trackIdx + 1];
    if (nxt) {
      playTrack(nxt);
    } else {
      // sfârșit de listă → revine la radio, NU reia aceeași piesă la infinit
      backToLiveRef.current?.();
    }
  }, [queue, trackIdx, playTrack]);

  const prev = useCallback(() => {
    if (modeRef.current !== "track" || trackIdx < 0) return;
    const audio = audioRef.current;
    // comportament standard: >3s în piesă → înapoi la începutul piesei; altfel → piesa precedentă
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }
    const prv = queue[trackIdx - 1];
    if (prv) playTrack(prv);
    else if (audio) { audio.currentTime = 0; setProgress(0); }
  }, [queue, trackIdx, playTrack]);

  const backToLive = useCallback(() => {
    setMode("live");
    setTrackIdx(-1);
    syncLive().then(() => {
      const audio = audioRef.current;
      if (audio) {
        setStatus("playing");
        audio.play().catch(() => setStatus("error"));
      }
    });
  }, [syncLive]);
  const backToLiveRef = useRef(backToLive);
  backToLiveRef.current = backToLive;

  const seek = useCallback((sec) => {
    // seek liber doar în redarea on-demand; live-ul e condus de server
    if (modeRef.current !== "live" && audioRef.current) {
      audioRef.current.currentTime = sec;
      setProgress(sec);
    }
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // ---------- EVENIMENTE AUDIO (legate o singură dată, pe elementul persistent) ----------

  const onLoaded = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pendingSeekRef.current != null) {
      try { audio.currentTime = pendingSeekRef.current; } catch { /* încă se încarcă */ }
      pendingSeekRef.current = null;
    }
    setDuration(audio.duration || 0);
    if (statusRef.current === "loading" || statusRef.current === "playing") {
      setStatus("playing");
      audio.play().catch(() => {});
    }
  };
  const onTime = () => { if (audioRef.current) setProgress(audioRef.current.currentTime); };
  const onEnded = () => {
    if (modeRef.current === "track") next();
    else syncLive(); // live: serverul a trecut la următoarea; syncLive realiniază
  };
  const onError = () => {
    // link semnat expirat (pauză lungă) → cerem unul proaspăt și reiem o singură dată
    const t = currentRef.current;
    const audio = audioRef.current;
    if (t && audio && Date.now() - resignRef.current > 10000) {
      resignRef.current = Date.now();
      signSrc(t.audio_url).then((src) => {
        audio.src = src;
        audio.load();
        if (statusRef.current === "playing") audio.play().catch(() => setStatus("error"));
      });
      return;
    }
    setStatus("error");
  };

  return (
    <RadioContext.Provider value={{
      mode, status, playing, liveInfo, current, queue, trackIdx, progress, duration, volume, muted, listeners,
      play, pause, stop, toggle, next, prev, seek, setVolume, toggleMute, playTrack, backToLive, syncLive,
      audioRef, expectedPosition,
    }}>
      {children}
      <audio
        ref={audioRef}
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTime}
        onEnded={onEnded}
        onError={onError}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        data-testid="radio-audio"
      />
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
