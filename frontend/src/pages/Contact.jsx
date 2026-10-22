import React, { useState } from "react";
import { MessageCircle, Youtube, Instagram, Music2, Send, Mail } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import DiscordButton from "@/components/DiscordButton";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "Eveniment / Booking", message: "" });
  const [sending, setSending] = useState(false);
  const [nlEmail, setNlEmail] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success("Mesaj trimis!", { description: "BIOXIC revine cu răspuns cât mai curând." });
      setForm({ name: "", email: "", subject: "Eveniment / Booking", message: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  const subscribe = async () => {
    try {
      await api.post("/newsletter", { email: nlEmail });
      toast.success("Te-ai abonat!", { description: "Afli primul când apare piesă nouă sau intrăm live." });
      setNlEmail("");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const inputCls = "w-full bg-black/40 border border-white/10 px-4 py-3 text-sm focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition-colors";

  return (
    <div data-testid="contact-page" className="max-w-7xl mx-auto px-6 py-14">
      <p className="text-[#00C853] text-xs uppercase tracking-[0.4em] mb-3">Booking & Colaborări</p>
      <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-14">
        Contact<span className="text-[#39FF14]">.</span>
      </h1>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* FORMULAR */}
        <form onSubmit={submit} className="lg:col-span-3 glass rounded-sm p-8 space-y-5" data-testid="contact-form">
          <h2 className="font-display font-bold text-lg uppercase tracking-widest">Trimite un mesaj</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input data-testid="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Numele tău" className={inputCls} />
            <input data-testid="contact-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inputCls} />
          </div>
          <select data-testid="contact-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls}>
            <option>Eveniment / Booking</option>
            <option>Colaborare</option>
            <option>Remix la comandă</option>
            <option>Altceva</option>
          </select>
          <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Spune-ne despre eveniment sau proiect..." className={inputCls} />
          <button data-testid="contact-submit" disabled={sending} className="flex items-center gap-2 px-8 py-4 bg-[#39FF14] text-black font-display font-bold text-sm tracking-widest uppercase hover:bg-[#00C853] transition-colors disabled:opacity-50">
            <Send size={15} /> {sending ? "Se trimite..." : "Trimite mesajul"}
          </button>
        </form>

        {/* LATERAL */}
        <div className="lg:col-span-2 space-y-6">
          <a data-testid="whatsapp-button" href="https://wa.me/447400998964" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 glass rounded-sm p-6 hover:border-[#39FF14]/50 hover:box-glow transition-all group">
            <span className="p-3 bg-[#39FF14] rounded-sm"><MessageCircle size={22} className="text-black" /></span>
            <div>
              <p className="font-display font-bold uppercase tracking-wide group-hover:text-[#39FF14] transition-colors">WhatsApp Business</p>
              <p className="text-xs text-zinc-500 mt-1">+44 7400 998964 — răspuns rapid pentru booking</p>
            </div>
          </a>

          <div className="glass rounded-sm p-6">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Social</h3>
            <div className="space-y-3">
              <a data-testid="contact-youtube" href="https://www.youtube.com/@djbioxic" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-zinc-300 hover:text-[#39FF14] transition-colors"><Youtube size={17} className="text-[#39FF14]" /> youtube.com/@djbioxic</a>
              <a data-testid="contact-tiktok" href="https://www.tiktok.com/@bioxic.exe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-zinc-300 hover:text-[#39FF14] transition-colors"><Music2 size={17} className="text-[#39FF14]" /> @bioxic.exe</a>
              <a data-testid="contact-instagram" href="https://www.instagram.com/crss.exe_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-zinc-300 hover:text-[#39FF14] transition-colors"><Instagram size={17} className="text-[#39FF14]" /> @crss.exe_</a>
            </div>
          </div>

          <div className="glass rounded-sm p-6">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Comunitate</h3>
            <DiscordButton tid="contact-discord" compact={false} />
          </div>

          <div className="glass rounded-sm p-6" data-testid="newsletter-box">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2"><Mail size={15} className="text-[#39FF14]" /> Notificări fani</h3>
            <p className="text-xs text-zinc-500 mb-4">Primești vești când apare o piesă nouă sau când BIOXIC intră live.</p>
            <div className="flex gap-2">
              <input data-testid="newsletter-email" type="email" value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} placeholder="email@exemplu.ro"
                className="flex-1 bg-black/40 border border-white/10 px-3 py-2.5 text-sm focus:border-[#39FF14] outline-none" />
              <button data-testid="newsletter-subscribe" onClick={subscribe} className="px-4 py-2.5 border border-[#39FF14] text-[#39FF14] text-xs font-bold uppercase tracking-widest hover:bg-[#39FF14] hover:text-black transition-colors">Abonează</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
