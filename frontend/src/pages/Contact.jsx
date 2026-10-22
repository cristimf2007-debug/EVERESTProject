import React, { useState } from "react";
import { Copy } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import DiscordButton from "@/components/DiscordButton";

const KINDS = ["Colaborare", "Booking", "Versuri", "Video / design", "Altceva"];

const inputCls = "w-full rounded-xl border border-[rgba(234,242,237,0.22)] bg-black/30 px-3.5 py-3 text-sm outline-none transition-all focus:border-[#f3c46a] focus:shadow-[0_0_0_3px_rgba(243,196,106,0.16)]";
const labelCls = "font-mono-x text-[11px] tracking-[0.14em] uppercase text-[#9db3a8] block mb-1.5";

export default function Contact() {
  const [kind, setKind] = useState("Colaborare");
  const [form, setForm] = useState({ name: "", reach: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", { name: form.name, email: form.reach, subject: kind, message: form.message });
      setSent(true);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success("Copiat ✓")).catch(() => {});

  return (
    <div data-testid="contact-page" className="max-w-[1120px] mx-auto px-4 py-10">
      <div className="eyebrow">Contact</div>
      <h1 className="font-display font-black text-[clamp(36px,7vw,76px)] leading-[0.95] tracking-tight" data-testid="contact-title">
        Hai să facem<br /><em className="not-italic text-[#f3c46a]">un hit</em>.
      </h1>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 items-start mt-7">
        <div className="grid gap-3.5">
          <div className="glass p-6 grid gap-2">
            <div className="eyebrow">Pentru ce mă poți chema</div>
            <p className="text-sm text-[#9db3a8]">Colaborări pe piese, versuri la comandă, editare și producție video, design și branding pentru artiști, management.</p>
          </div>
          <div className="glass p-6 grid gap-3">
            <div className="eyebrow">Cel mai rapid răspuns</div>
            {["@crss.exe_", "@bioxic.exe", "+44 7400 998964"].map((c) => (
              <div key={c} className="flex items-center justify-between gap-2 border border-[rgba(234,242,237,0.11)] rounded-xl px-3 py-2.5">
                <b className="font-semibold text-sm select-all break-all">{c}</b>
                <button data-testid={`copy-${c.replace(/[^a-z0-9]/gi, "")}`} onClick={() => copy(c)} className="btn-x !py-1.5 !px-3 text-xs shrink-0">
                  <Copy size={12} /> Copiază
                </button>
              </div>
            ))}
            <p className="text-[13px] text-[#9db3a8]">Instagram, TikTok sau WhatsApp, în mesaje private.</p>
          </div>
          <DiscordButton tid="contact-discord" compact />
        </div>

        <div>
          {!sent ? (
            <form onSubmit={submit} className="glass frost-edge p-7 grid gap-4" data-testid="contact-form">
              <div>
                <label className={labelCls}>Despre ce e vorba</label>
                <div className="flex flex-wrap gap-2" data-testid="contact-kinds">
                  {KINDS.map((k) => (
                    <button type="button" key={k} data-testid={`kind-${k.toLowerCase().replace(/[^a-z]/g, "")}`}
                      onClick={() => setKind(k)}
                      className={`chip-x transition-colors ${kind === k ? "!bg-[#eaf2ed] !text-[#06110d] !border-transparent font-semibold" : "hover:border-[#f3c46a]/50"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls} htmlFor="cName">Numele tău</label>
                  <input id="cName" data-testid="contact-name" required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex. Andrei Popescu" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="cReach">Unde îți răspund</label>
                  <input id="cReach" data-testid="contact-reach" required maxLength={120} value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value })} placeholder="Telefon, email sau @instagram" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="cMsg">Mesajul</label>
                <textarea id="cMsg" data-testid="contact-message" required maxLength={2000} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Spune-mi ce ai în minte: piesa, data, orașul, bugetul." className={`${inputCls} resize-vertical min-h-[150px]`} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button type="submit" data-testid="contact-submit" disabled={sending} className="btn-x gold disabled:opacity-50">
                  {sending ? "Se trimite..." : "Trimite mesajul"}
                </button>
              </div>
              <p className="text-[13px] text-[#9db3a8]">Mesajul ajunge direct în căsuța lui BIOXIC de pe site.</p>
            </form>
          ) : (
            <div className="glass p-7 grid gap-2.5 place-items-start" data-testid="contact-ok">
              <span className="font-display font-black text-[13px] tracking-[0.14em] text-[#f3c46a] border-2 border-[#f3c46a] rounded-xl px-3 py-1.5 -rotate-3">TRIMIS</span>
              <h3 className="font-display font-bold text-[22px]">Am primit mesajul.</h3>
              <p className="text-[#9db3a8] text-sm">Îți răspund la contactul pe care l-ai lăsat. Dacă e urgent, scrie-mi și pe Instagram.</p>
              <button data-testid="contact-again" onClick={() => { setSent(false); setForm({ name: "", reach: "", message: "" }); }} className="btn-x !py-2 !px-4 text-[13px] mt-2">Scrie alt mesaj</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
