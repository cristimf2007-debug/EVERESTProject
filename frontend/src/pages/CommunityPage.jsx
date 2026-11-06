import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, Check, LoaderCircle, MessageCircle, Search, Send, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { useFan } from "@/context/FanContext";

const TABS = [
  ["friends", "Prieteni"], ["messages", "Mesaje"], ["followers", "Urmăritori"],
  ["following", "Urmărești"], ["notifications", "Notificări"],
];

function MemberRow({ user, action, actionLabel, disabled = false }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-3">
      <Link to={`/u/${encodeURIComponent(user.username)}`} className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold">
        {user.picture ? <img src={mediaUrl(user.picture)} alt="" className="h-full w-full object-cover" /> : (user.name || "F").slice(0, 1).toUpperCase()}
      </Link>
      <Link to={`/u/${encodeURIComponent(user.username)}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{user.name}</span>
        <span className="block truncate text-xs text-white/40">@{user.username}</span>
      </Link>
      {action && <button type="button" disabled={disabled} onClick={action} aria-label={actionLabel} title={actionLabel}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/65 hover:bg-white/[.07] disabled:opacity-40">{actionLabel === "Acceptă" ? <Check size={15} /> : actionLabel === "Respinge" ? <X size={15} /> : <UserPlus size={15} />}</button>}
    </div>
  );
}

export default function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { me, setLoginOpen } = useFan();
  const tab = TABS.some(([key]) => key === searchParams.get("tab")) ? searchParams.get("tab") : "friends";
  const requestedConversation = searchParams.get("with");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [relationship, setRelationship] = useState({ followers: [], following: [] });
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!me || typeof me !== "object") return;
    setLoading(true);
    setError("");
    try {
      if (tab === "friends") {
        const [friendRows, requestRows] = await Promise.all([api.get("/fans/friends"), api.get("/fans/friends/requests")]);
        setFriends(friendRows.data);
        setRequests(requestRows.data);
      } else if (tab === "followers" || tab === "following") {
        const { data } = await api.get(`/fans/social/${encodeURIComponent(me.username)}/followers`);
        setRelationship(data);
      } else if (tab === "messages") {
        const { data } = await api.get("/fans/conversations");
        setConversations(data);
      } else if (tab === "notifications") {
        const { data } = await api.get("/fans/notifications");
        setNotifications(data);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [me, tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab !== "messages" || !requestedConversation || !conversations.length) return;
    setSelected(conversations.find((conversation) => conversation.user.user_id === requestedConversation) || null);
  }, [conversations, requestedConversation, tab]);
  useEffect(() => {
    if (tab !== "messages" || !selected) return;
    let active = true;
    api.get(`/fans/messages/${encodeURIComponent(selected.user.user_id)}`)
      .then(({ data }) => { if (active) setMessages(data); })
      .catch((err) => { if (active) toast.error(formatApiError(err)); });
    return () => { active = false; };
  }, [selected, tab]);

  const searchMembers = async (event) => {
    event.preventDefault();
    if (search.trim().length < 2) return;
    try {
      const { data } = await api.get("/fans/search", { params: { q: search.trim() } });
      setResults(data);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const sendFriendRequest = async (username) => {
    try {
      await api.post("/fans/friends/requests", { username });
      toast.success("Cererea de prietenie a fost trimisă.");
      setResults((current) => current.filter((item) => item.username !== username));
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const answerRequest = async (id, action) => {
    try {
      await api.patch(`/fans/friends/requests/${encodeURIComponent(id)}`, { action });
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/fans/messages/${encodeURIComponent(selected.user.user_id)}`, { text: draft.trim() });
      setMessages((current) => [...current, data]);
      setDraft("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  const markRead = async (notification) => {
    try {
      await api.post(`/fans/notifications/${encodeURIComponent(notification.id)}/read`);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (!me || typeof me !== "object") {
    return <section className="mx-auto max-w-3xl px-5 py-20 text-center">
      <Users className="mx-auto text-white/35" size={28} /><h1 className="mt-4 font-display text-2xl">Comunitatea BIOXIC</h1>
      <p className="mt-2 text-sm text-white/50">Conectează-te pentru prieteni, mesaje și notificări.</p>
      <button onClick={() => setLoginOpen(true)} className="btn-flame mt-6 !px-6">Continuă cu Google</button>
    </section>;
  }

  const rows = tab === "followers" ? relationship.followers : relationship.following;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[.25em] text-[var(--flame)]">BIOXIC / COMMUNITY</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Comunitatea ta</h1>
        <p className="mt-2 text-sm text-white/45">Prieteni, conversații și conexiunile tale reale.</p>
      </header>
      <nav aria-label="Secțiuni comunitate" className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-1">
        {TABS.map(([key, label]) => <button key={key} onClick={() => { setSelected(null); setSearchParams({ tab: key }); }}
          aria-current={tab === key ? "page" : undefined} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs transition ${tab === key ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"}`}>{label}</button>)}
      </nav>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {loading ? <div className="grid min-h-44 place-items-center"><LoaderCircle className="animate-spin text-white/40" /></div> : (
        <section className="rounded-2xl border border-white/[.07] bg-[#111315]/90 p-4 sm:p-5">
          {tab === "friends" && <>
            <form onSubmit={searchMembers} className="mb-5 flex gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
                <Search size={15} className="shrink-0 text-white/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută după username" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
              </label><button className="btn-steel !px-4 text-xs">Caută</button>
            </form>
            {results.length > 0 && <div className="mb-5 grid gap-2">{results.map((user) => <MemberRow key={user.user_id} user={user} action={() => sendFriendRequest(user.username)} actionLabel="Adaugă prieten" />)}</div>}
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Cereri de prietenie</h2>
            {requests.length ? <div className="mb-6 grid gap-2">{requests.map((request) => <div key={request.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1"><MemberRow user={request.user} /></div>
              {request.direction === "incoming" ? <><button onClick={() => answerRequest(request.id, "accept")} aria-label="Acceptă cererea" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/15"><Check size={15} /></button><button onClick={() => answerRequest(request.id, "decline")} aria-label="Respinge cererea" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/50 hover:bg-white/10"><X size={15} /></button></> : <span className="pr-2 text-[10px] text-white/35">Trimisă</span>}
            </div>)}</div> : <p className="mb-6 text-xs text-white/35">Nu ai cereri în așteptare.</p>}
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Prieteni</h2>
            {friends.length ? <div className="grid gap-2 sm:grid-cols-2">{friends.map((user) => <MemberRow key={user.user_id} user={user} />)}</div> : <p className="text-xs text-white/35">Caută un username pentru a-ți găsi prietenii.</p>}
          </>}

          {(tab === "followers" || tab === "following") && (rows.length
            ? <div className="grid gap-2 sm:grid-cols-2">{rows.map((user) => <MemberRow key={user.user_id} user={user} />)}</div>
            : <p className="py-8 text-center text-sm text-white/40">{tab === "followers" ? "Încă nu ai urmăritori." : "Încă nu urmărești pe nimeni."}</p>)}

          {tab === "messages" && <div className="grid min-h-[340px] gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2 border-b border-white/[.07] pb-3 md:border-b-0 md:border-r md:pr-3">
              <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-white/45">Conversații</h2>
              {conversations.map((conversation) => <button key={conversation.user.user_id} onClick={() => setSelected(conversation)}
                className={`flex w-full items-center gap-2 rounded-xl p-2 text-left ${selected?.user.user_id === conversation.user.user_id ? "bg-white/[.08]" : "hover:bg-white/[.04]"}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-xs">{conversation.user.picture ? <img src={mediaUrl(conversation.user.picture)} alt="" className="h-full w-full object-cover" /> : conversation.user.name.slice(0, 1)}</span>
                <span className="min-w-0"><span className="block truncate text-xs">{conversation.user.name}</span><span className="block truncate text-[10px] text-white/35">{conversation.last_message?.text || "Începe o conversație"}</span></span>
              </button>)}
              {!conversations.length && <p className="px-2 text-xs text-white/35">Mesajele private sunt disponibile între prieteni.</p>}
            </div>
            <div className="flex min-h-[300px] flex-col">
              {selected ? <>
                <Link to={`/u/${encodeURIComponent(selected.user.username)}`} className="border-b border-white/[.07] pb-3 text-sm font-medium">{selected.user.name} <span className="ml-1 text-xs text-white/35">@{selected.user.username}</span></Link>
                <div className="flex-1 space-y-3 overflow-y-auto py-4">
                  {messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.from_user_id === me.user_id ? "ml-auto bg-[var(--flame)]/15 text-white" : "bg-white/[.06] text-white/80"}`}>{message.text}</div>)}
                  {!messages.length && <p className="text-center text-xs text-white/35">Începe conversația cu {selected.user.name}.</p>}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/[.07] pt-3">
                  <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Scrie un mesaj…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-white/25" />
                  <button type="submit" disabled={sending || !draft.trim()} aria-label="Trimite mesajul" className="btn-flame !h-11 !w-11 !p-0 disabled:opacity-40"><Send size={15} /></button>
                </form>
              </> : <div className="grid flex-1 place-items-center text-center text-xs text-white/35"><span><MessageCircle size={22} className="mx-auto mb-2 opacity-50" />Alege o conversație sau conectează-te cu un prieten.</span></div>}
            </div>
          </div>}

          {tab === "notifications" && (notifications.length
            ? <div className="grid gap-2">{notifications.map((item) => <button key={item.id} onClick={() => markRead(item)} className={`rounded-xl border px-4 py-3 text-left ${item.read ? "border-white/[.05] bg-white/[.015]" : "border-white/[.09] bg-white/[.04]"}`}>
              <span className="flex items-center gap-2 text-sm font-medium">{item.title}{!item.read && <span className="h-1.5 w-1.5 rounded-full bg-[var(--flame)]" />}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/45">{item.text}</span>
              <span className="mt-2 block text-[10px] text-white/30">{new Date(item.created_at).toLocaleString("ro-RO")}</span>
            </button>)}</div>
            : <div className="py-10 text-center text-sm text-white/40"><Bell size={22} className="mx-auto mb-3 opacity-40" />Nu ai notificări noi.</div>)}
        </section>
      )}
    </main>
  );
}
