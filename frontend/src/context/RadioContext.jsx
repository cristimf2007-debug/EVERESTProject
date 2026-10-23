import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api, { mediaUrl, getSid } from "@/lib/api";

const RadioContext = createContext(null);
const DRIFT = 3; // secunde — toleranță de sincronizare cu radioul

export function RadioProvider({ children }) {
  const audioRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const modeRef = useRef("live");
  const playingRef = useRef(false);
  const [mode, setModeState] = useState("live"); // "live" | "track"
  const [liveInfo, setLiveInfo] = useState(null);
  const [current, setCurrent] = useState(null);
  const [playing, setPlayingState] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [listeners, setListeners] = useState(0);

  const setPlaying = (v) => { playingRef.current = v; setPlayingState(v); };
  const setMode = (m) => { modeRef.current = m; setModeState(m); };

  const syncLive = useCallback(async () => {
    try {
      const r = await api.get("/radio/now");
      const data = r.data;
      setLiveInfo(data);
      if (typeof data.listeners === "number") setListeners(data.listeners);
      if (modeRef.current !== "live") return;
      if (!data.track) { setCurrent(null); return; }
      setCurrent(data.track);
      const audio = audioRef.current;
      if (!audio) return;
      const src = mediaUrl(data.track.audio_url);
      if (audio.getAttribute("data-src") !== src) {
        audio.setAttribute("data-src", src);
        pendingSeekRef.current = data.position;
        audio.src = src;
        audio.load();
      } else if (Math.abs(audio.currentTime - data.position) > DRIFT) {
        audio.currentTime = data.position;
      }
      if (playingRef.current) audio.play().catch(() => setPlaying(false));
    } catch { /* reîncearcă la ciclul următor */ }
  }, []);

  useEffect(() => {
    syncLive();
    const t = setInterval(syncLive, 12000);
    return () => clearInterval(t);
  }, [syncLive]);

  useEffect(() => {
    const beat = () => api.post("/radio/heartbeat", { sid: getSid() })
      .then((r) => setListeners(r.data.listeners)).catch(() => {});
    beat();
    const t = setInterval(beat, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playingRef.current) {
      audio.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
      if (modeRef.current === "live") syncLive();
      else audio.play().catch(() => setPlaying(false));
    }
  }, [current, syncLive]);

  const playTrack = useCallback((t) => {
    const audio = audioRef.current;
    if (!audio) return;
    setMode("track");
    setCurrent(t);
    pendingSeekRef.current = 0;
    const src = mediaUrl(t.audio_url);
    audio.setAttribute("data-src", src);
    audio.src = src;
    audio.load();
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
    api.post(`/tracks/${t.id}/play`).catch(() => {});
  }, []);

  const backToLive = useCallback(() => {
    setMode("live");
    syncLive().then(() => {
      const audio = audioRef.current;
      if (audio) { setPlaying(true); audio.play().catch(() => setPlaying(false)); }
    });
  }, [syncLive]);

  const seek = useCallback((sec) => {
    if (modeRef.current !== "live" && audioRef.current) {
      audioRef.current.currentTime = sec;
      setProgress(sec);
    }
  }, []);

  const onLoaded = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pendingSeekRef.current != null) {
      try { audio.currentTime = pendingSeekRef.current; } catch { /* fișier încă se încarcă */ }
      pendingSeekRef.current = null;
    }
    setDuration(audio.duration || 0);
  };
  const onTime = () => { if (audioRef.current) setProgress(audioRef.current.currentTime); };
  const onEnded = () => {
    if (modeRef.current === "track") backToLive();
    else syncLive();
  };

  return (
    <RadioContext.Provider value={{
      mode, liveInfo, current, playing, progress, duration, volume, listeners,
      toggle, playTrack, backToLive, seek, setVolume, syncLive,
    }}>
      {children}
      <audio ref={audioRef} onLoadedMetadata={onLoaded} onTimeUpdate={onTime} onEnded={onEnded} data-testid="radio-audio" />
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
