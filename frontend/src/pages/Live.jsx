import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Heart, Crown, Send, Radio, Users, CalendarClock, Music, Hand, Copy, CreditCard, UserPlus, UserCheck } from "lucide-react";
import api, { WS_URL } from "@/lib/api";
import { useFan } from "@/context/FanContext";
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

function Avatar({ name, picture, size = 22 }) {
  if (picture) return <img src={picture} alt={name} className="rounded-full border border-[#39FF14]/50 object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="rounded-full bg-[#39FF14]/15 border border-[#39FF14]/40 flex items-center justify-center text-[#39FF14] font-bold" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {(name || "F")[0].toUpperCase()}
    </span>
  );
}

export default function Live() {
  const { fan } = useFan();
  const [status, setStatus] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [messages, setMessages] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [viewersList, setViewersList] = useState([]);
  const [likes, setLikes] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [name, setName] = useState(localStorage.getItem("bioxic_name") || "");
  const [input, setInput] = useState("");
  const [reqSong, setReqSong] = useState("");
  const [connected, setConnected] = useState(false);
  const [follow, setFollow] = useState({ followers: 0, following: false });
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get("/live/status").then((r) => { setStatus(r.data); setViewers(r.data.viewers || 0); setViewersList(r.data.viewers_list || []); setLikes(r.data.likes || 0); }).catch(() => {});
    api.get("/live/schedule").then((r) => setSchedule(r.data || [])).catch(() => {});
    api.get("/follow/status").then((r) => setFollow(r.data)).catch(() => {});
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
          else if (data.type === "message") setMessages((m) => [...m.slice(-100), data]);
          else if (data.type === "join") setMessages((m) => [...m.slice(-100), { id: data.id, type: "system", text: `${data.name} a intrat în live`, picture: data.picture }]);
          else if (data.type === "leave") setMessages((m) => [...m.slice(-100), { id: data.id, type: "system", text: `${data.name} a ieșit` }]);
          else if (data.type === "delete") setMessages((m) => m.filter((x) => x.id !== data.id));
          else if (data.type === "viewers") { setViewers(data.count); setViewersList(data.users || []); }
          else if (data.type === "like_count") setLikes(data.total);
          else if (data.type === "live") setStatus((s) => ({ ...(s || {}), is_live: data.is_live }));
          else if (data.type === "reaction") {
            const id = data.id;
            setReactions((r) => [...r.slice(-24), { id, emoji: data.emoji, x: 10 + Math.random() * 80 }]);
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

  const toggleFollow = async () => {
    if (!fan) {
      toast.info("Intră în cont ca să dai follow", { action: { label: "Cont", onClick: () => (window.location.href = "/cont") } });
      return;
    }
    try {
      const r = await api.post("/fans/follow");
      setFollow({ followers: r.data.followers, following: r.data.following });
      toast.success(r.data.following ? "Urmărești canalul BIOXIC!" : "Ai dat unfollow");
    } catch (e) { toast.error("Eroare la follow"); }
  };

  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success("Copiat ✓")).catch(() => {});

  const nextShow = schedule.find((s) => new Date(s.date) > new Date());
  const embedSrc = status?.youtube_video_id
    ? `https://www.youtube.com/embed/${status.youtube_video_id}?autoplay=1`
    : `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1`;

  return (
    <div data-testid="live-page" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter">
          Live<span className="text-[#39FF14]">.</span>
        </h1>
        {status?.is_live && (
          <span data-testid="live-now-badge" className="flex items-center gap-2 px-4 py-2 bg-[#39FF14] text-black font-display font-bold text-xs tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-black live-dot" /> Live acum
          </span>
        )}
        <button data-testid="live-follow-button" onClick={toggleFollow}
          className={`ml-auto flex items-center gap-2 px-5 py-2.5 font-display font-bold text-xs tracking-widest uppercase transition-colors ${follow.following ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/50" : "bg-[#39FF14] text-black hover:bg-[#00C853]"}`}>
          {follow.following ? <UserCheck size={14} /> : <UserPlus size={14} />}
          {follow.following ? "Urmărit" : "Follow"} · {follow.followers}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
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
                  <p className="mt-4 text-sm text-zinc-500">Programul live-urilor va fi anunțat în curând.</p>
                )}
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" data-testid="reactions-layer">
              {reactions.map((r) => {
                const Icon = REACTION_ICONS[r.emoji] || Heart;
                return (
                  <span key={r.id} className="absolute bottom-4 float-reaction" style={{ left: `${r.x}%` }}>
                    <Icon size={26} className="text-[#39FF14]" fill={r.emoji === "heart" ? "#39FF14" : "none"} style={{ filter: "drop-shadow(0 0 8px rgba(57,255,20,0.8))" }} />
                  </span>
                );
              })}
            </div>
          </div>

          {/* CONTROALE: spectatori + reacții + tap */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-3" data-testid="viewers-panel">
              <span className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest">
                <Users size={14} className="text-[#39FF14]" />
                <span data-testid="viewer-count" className="text-white font-bold">{viewers}</span> spectatori
              </span>
              {viewersList.length > 0 && (
                <div className="flex -space-x-2" data-testid="viewers-avatars">
                  {viewersList.slice(0, 8).map((u) => (
                    <Link key={u.user_id} to={`/fan/${u.user_id}`} title={u.name} data-testid={`viewer-${u.user_id}`}>
                      <Avatar name={u.name} picture={u.picture} size={26} />
                    </Link>
                  ))}
                  {viewersList.length > 8 && <span className="text-[10px] text-zinc-500 pl-3 self-center">+{viewersList.length - 8}</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button data-testid="tap-like-button" onClick={() => send({ type: "tap" })}
                className="flex items-center gap-2 px-5 py-3 bg-[#39FF14]/10 border border-[#39FF14]/50 rounded-sm text-[#39FF14] hover:bg-[#39FF14]/20 active:scale-90 transition-all"
                aria-label="Tap like">
                <Hand size={17} /> <Heart size={14} fill="#39FF14" /> <span className="text-xs font-bold" data-testid="tap-count">{likes}</span>
              </button>
              <div className="flex gap-2" data-testid="reaction-buttons">
                {[["fire", Flame], ["crown", Crown]].map(([key, Icon]) => (
                  <button key={key} data-testid={`reaction-${key}`} onClick={() => send({ type: "reaction", emoji: key })}
                    className="p-3 glass rounded-sm text-[#39FF14] hover:bg-[#39FF14]/20 hover:scale-110 transition-all" aria-label={`Reacție ${key}`}>
                    <Icon size={17} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DONEAZĂ + CERERI */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="glass rounded-sm p-5" data-testid="donate-box">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-3">
                <CreditCard size={15} className="text-[#39FF14]" /> Susține live-ul
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Fiecare donație înseamnă o piesă nouă.</p>
              <a href="https://www.paypal.com/[LINK_PAYPAL]" target="_blank" rel="noopener noreferrer" data-testid="donate-paypal"
                className="block text-center w-full px-4 py-2.5 mb-3 border border-[#39FF14]/50 text-[#39FF14] text-xs font-bold uppercase tracking-widest hover:bg-[#39FF14] hover:text-black transition-colors">
                Donează PayPal
              </a>
              <div className="text-[11px] text-zinc-400 space-y-1.5">
                <p className="uppercase tracking-widest text-zinc-600">Transfer UK — C Maxim</p>
                <div className="flex justify-between items-center">Sort: <span className="font-mono text-white">20-25-98</span>
                  <button data-testid="donate-copy-sort" onClick={() => copy("20-25-98")} className="p-1 text-zinc-500 hover:text-[#39FF14]"><Copy size={12} /></button></div>
                <div className="flex justify-between items-center">Cont: <span className="font-mono text-white">73583767</span>
                  <button data-testid="donate-copy-acc" onClick={() => copy("73583767")} className="p-1 text-zinc-500 hover:text-[#39FF14]"><Copy size={12} /></button></div>
              </div>
            </div>
            <div className="glass rounded-sm p-5" data-testid="song-request-box">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-3"><Music size={15} className="text-[#39FF14]" /> Cere o piesă</h3>
              <div className="flex gap-2">
                <input data-testid="song-request-input" value={reqSong} onChange={(e) => setReqSong(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendRequest()} placeholder="Ce piesă vrei să aud?"
                  className="flex-1 bg-black/40 border border-white/10 px-3 py-2.5 text-sm focus:border-[#39FF14] outline-none" />
                <button data-testid="song-request-send" onClick={sendRequest} className="px-4 py-2.5 bg-[#39FF14] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[#00C853] transition-colors">Trimite</button>
              </div>
            </div>
          </div>

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
            {messages.map((m) => m.type === "system" ? (
              <p key={m.id} className="text-[11px] text-zinc-600 italic flex items-center gap-2" data-testid={`chat-system-${m.id}`}>
                {m.picture && <Avatar name="?" picture={m.picture} size={16} />} {m.text}
              </p>
            ) : (
              <div key={m.id} className="text-sm flex items-start gap-2.5">
                {m.user_id ? (
                  <Link to={`/fan/${m.user_id}`} className="shrink-0 mt-0.5"><Avatar name={m.name} picture={m.picture} size={22} /></Link>
                ) : (
                  <span className="shrink-0 mt-0.5"><Avatar name={m.name} picture="" size={22} /></span>
                )}
                <div className="min-w-0">
                  <span className="text-[#39FF14] font-semibold text-xs uppercase tracking-wide">{m.name}</span>
                  <p className="text-zinc-300 break-words">{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-white/10 space-y-2">
            {!fan && (
              <input data-testid="chat-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tău"
                className="w-full bg-black/40 border border-white/10 px-3 py-2 text-xs focus:border-[#39FF14] outline-none" />
            )}
            {fan && <p className="text-[11px] text-zinc-500 flex items-center gap-2"><Avatar name={fan.name} picture={fan.picture} size={18} /> Scrii ca <span className="text-[#39FF14] font-semibold">{fan.name}</span></p>}
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
