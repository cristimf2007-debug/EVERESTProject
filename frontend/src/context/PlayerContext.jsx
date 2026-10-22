import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api, { mediaUrl } from "@/lib/api";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const countedRef = useRef(null);

  const current = index >= 0 && index < queue.length ? queue[index] : null;

  const playTrack = useCallback((track, list) => {
    const newQueue = list && list.length ? list : [track];
    const idx = newQueue.findIndex((t) => t.id === track.id);
    setQueue(newQueue);
    setIndex(idx >= 0 ? idx : 0);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (!current) return;
    setPlaying((p) => !p);
  }, [current]);

  const next = useCallback(() => {
    if (!queue.length) return;
    setIndex((i) => {
      if (shuffle) return Math.floor(Math.random() * queue.length);
      return (i + 1) % queue.length;
    });
    setPlaying(true);
  }, [queue.length, shuffle]);

  const prev = useCallback(() => {
    if (!queue.length) return;
    setIndex((i) => (i - 1 + queue.length) % queue.length);
    setPlaying(true);
  }, [queue.length]);

  const seek = useCallback((sec) => {
    if (audioRef.current) {
      audioRef.current.currentTime = sec;
      setProgress(sec);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = mediaUrl(current.audio_url);
    audio.volume = volume;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
      if (countedRef.current !== current.id) {
        countedRef.current = current.id;
        api.post(`/tracks/${current.id}/play`).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const onTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };
  const onLoaded = () => {
    if (audioRef.current) setDuration(audioRef.current.duration || 0);
  };
  const onEnded = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      next();
    }
  };

  return (
    <PlayerContext.Provider value={{
      current, queue, playing, progress, duration, volume, shuffle, repeat,
      playTrack, toggle, next, prev, seek, setVolume, setShuffle, setRepeat,
    }}>
      {children}
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoaded} onEnded={onEnded} data-testid="audio-element" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
