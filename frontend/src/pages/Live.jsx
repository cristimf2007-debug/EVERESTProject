import React, { useEffect, useRef, useState } from "react";
import { Flame, Heart, Crown, Send, Radio, Users, CalendarClock, Music } from "lucide-react";
import api, { WS_URL } from "@/lib/api";
import { toast } from "sonner";

const CHANNEL_ID = "UC2gQmatVSAB3nzqeDmYY3gw";
const REACTION_ICONS = { fire: Flame, heart: Heart, crown: Crown };

function Countdown({ target }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - new Date();
      if (diff <= 0) { setLeft("Începe curând"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${d > 0 ? `${d}z ` : ""}${h}h ${m}m ${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  return <span data-testid="live-countdown" className="font-display text-[#39FF14] text-glow tabular-nums">{left}</span>;
}

export default function Live() {
  const [status, setStatus] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [messages, setMessages] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [name, setName] = useState(localStorage.getItem("bioxic_name") || "");
  const [input, setInput] = useState("");
  const [reqSong, setReqSong] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get("/live/status").then((r) => { setStatus(r.data); setViewers(r.data.viewers || 0); }).catch(() => {});
    api.get("/live/schedule").then((r) => setSchedule(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let ws;
    let closed = false;
    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => { setConnected(false); if (!closed) setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "history") setMessages(data.messages.map((m) => ({ ...m, type: "message" })));
          else if (data.type === "message") setMessages((m) => [...m.slice(-80), data]);
          else if (data.type === "delete") setMessages((m) => m.filter((x) => x.id !== data.id));
          else if (data.type === "viewers") setViewers(data.count);
          else if (data.type === "live") setStatus((s) => ({ ...(s || {}), is_live: data.is_live }));
          else if (data.type === "reaction") {
            const id = data.id;
            setReactions((r) => [...r, { id, emoji: data.emoji, x: 10 + Math.random() * 80 }]);
            setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2700);
          } else if (data.type === "request") {
            toast.info(`${data.name} cere: ${data.song}`);
          } else if (data.type === "error") {
            toast.error(data.detail);
          }
        } catch (err) { /* ignoră */ }
      };
    };
    connect();
    return () => { closed = true; wsRef.current?.close(); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (payload) => {
    if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(payload));
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    localStorage.setItem("bioxic_name", name);
    send({ type: "message", name: name || "Fan", text: input });
    setInput("");
  };

  const sendRequest = async () => {
    if (!reqSong.trim()) return;
    try {
      await api.post("/live/requests", { name: name || "Fan", song: reqSong });
      setReqSong("");
      toast.success("Cerere trimisă!", { description: "BIOXIC o vede în timpul live-ului." });
    } catch (e) { toast.error("Nu s-a putut trimite cererea"); }
  };

  const nextShow = schedule.find((s) => new Date(s.date) > new Date());
  const embedSrc = status?.youtube_video_id
    ? `https://www.youtube.com/embed/${status.youtube_video_id}?autoplay=1`
    : `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1`;

  return (
    <div data-testid="live-page" className="max-w-7xl mx-auto px-6 py-14">
      <div className="flex items-center gap-4 mb-10">
        <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter">
          Live<span className="text-[#39FF14]">.</span>
        </h1>
        {status?.is_live && (
          <span data-testid="live-now-badge" className="flex items-center gap-2 px-4 py-2 bg-[#39FF14] text-black font-display font-bold text-xs tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-black live-dot" /> Live acum
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* VIDEO */}
        <div className="lg:col-span-2">
          <div className="relative glass rounded-sm overflow-hidden scanlines" data-testid="live-video-container">
            {status?.is_live ? (
              <div className="aspect-video">
                <iframe src={embedSrc} title="BIOXIC Live" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen data-testid="live-embed" />
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center bg-[#050805] p-8 text-center">
                <Radio size={48} className="text-[#39FF14]/40 mb-6" />
                <p className="font-display font-bold text-xl sm:text-2xl uppercase text-zinc-300" data-testid="offline-message">Momentan offline</p>
                {nextShow ? (
                  <p className="mt-4 text-sm text-zinc-500">
                    Următorul live: <span className="text-white font-semibold">{nextShow.title}</span> — <Countdown target={nextShow.date} />
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">Programul live-urilor va fi anunțat în curând. [PROGRAM_LIVE]</p>
                )}
              </div>
            )}
            {/* reacții plutitoare */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" data-testid="reactions-layer">
              {reactions.map((r) => {
                const Icon = REACTION_ICONS[r.emoji] || Flame;
                return (
                  <span key={r.id} className="absolute bottom-4 float-reaction" style={{ left: `${r.x}%` }}>
                    <Icon size={26} className="text-[#39FF14]" fill={r.emoji === "heart" ? "#39FF14" : "none"} style={{ filter: "drop-shadow(0 0 8px rgba(57,255,20,0.8))" }} />
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest">
              <Users size={14} className="text-[#39FF14]" />
              <span data-testid="viewer-count">{viewers} spectatori</span>
            </div>
            <div className="flex gap-2" data-testid="reaction-buttons">
              {[["fire", Flame], ["heart", Heart], ["crown", Crown]].map(([key, Icon]) => (
                <button key={key} data-testid={`reaction-${key}`} onClick={() => send({ type: "reaction", emoji: key })}
                  className="p-3 glass rounded-sm text-[#39FF14] hover:bg-[#39FF14]/20 hover:scale-110 transition-all" aria-label={`Reacție ${key}`}>
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* CERERI DE PIESE */}
          <div className="glass rounded-sm p-6 mt-6" data-testid="song-request-box">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-4"><Music size={16} className="text-[#39FF14]" /> Cere o piesă</h3>
            <div className="flex gap-2">
              <input data-testid="song-request-input" value={reqSong} onChange={(e) => setReqSong(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendRequest()} placeholder="Ce piesă vrei să aud?"
                className="flex-1 bg-black/40 border border-white/10 px-4 py-3 text-sm focus:border-[#39FF14] outline-none" />
              <button data-testid="song-request-send" onClick={sendRequest} className="px-6 py-3 bg-[#39FF14] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[#00C853] transition-colors">Trimite</button>
            </div>
          </div>

          {/* PROGRAM */}
          {schedule.length > 0 && (
            <div className="glass rounded-sm p-6 mt-6" data-testid="live-schedule">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-4"><CalendarClock size={16} className="text-[#39FF14]" /> Program live-uri</h3>
              <div className="space-y-3">
                {schedule.map((s) => (
                  <div key={s.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm">{s.title}</span>
                    <span className="text-xs text-[#39FF14] tabular-nums">{new Date(s.date).toLocaleString("ro-RO")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHAT */}
        <div className="glass rounded-sm flex flex-col h-[560px]" data-testid="live-chat">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="font-display font-bold text-sm uppercase tracking-widest">Chat live</span>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-[#39FF14]" : "bg-red-500"}`} title={connected ? "Conectat" : "Deconectat"} />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
            {messages.length === 0 && <p className="text-xs text-zinc-600 text-center mt-8">Niciun mesaj încă. Spune salut!</p>}
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="text-[#39FF14] font-semibold text-xs uppercase tracking-wide">{m.name}</span>
                <p className="text-zinc-300 break-words">{m.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-white/10 space-y-2">
            <input data-testid="chat-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tău"
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-xs focus:border-[#39FF14] outline-none" />
            <div className="flex gap-2">
              <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Scrie în chat..."
                className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[#39FF14] outline-none" />
              <button data-testid="chat-send" onClick={sendMessage} className="p-2.5 bg-[#39FF14] text-black hover:bg-[#00C853] transition-colors" aria-label="Trimite mesaj"><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
