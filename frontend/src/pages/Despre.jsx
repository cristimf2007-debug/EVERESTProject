import React from "react";
import { motion } from "framer-motion";
import { Biohazard, Bot, Disc3, Youtube } from "lucide-react";

const AI_IMG = "https://images.pexels.com/photos/7688748/pexels-photo-7688748.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const STAGE_IMG = "https://images.pexels.com/photos/10063275/pexels-photo-10063275.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const TIMELINE = [
  { year: "Începuturi", text: "Primele remixuri de manele încărcate pe YouTube — bas mai greu, tempo de club." },
  { year: "Colaborări", text: "Remixuri oficiale și colaborări cu AMMA, Big Up Music, Nek Music." },
  { year: "Manele Artificiale", text: "Nașterea conceptului AI: manele generate și modificate de inteligență artificială." },
  { year: "Azi", text: "Live-uri, comunitate, piese noi constant. No risks, no hits." },
];

const COLLABS = ["AMMA", "Big Up Music", "Nek Music", "Șușanu", "210 Production"];

export default function Despre() {
  return (
    <div data-testid="despre-page" className="max-w-7xl mx-auto px-6 py-14">
      <p className="text-[#8cc7a8] text-xs uppercase tracking-[0.4em] mb-3">Povestea</p>
      <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-14">
        Despre <span className="text-[#f3c46a]">BIOXIC</span>
      </h1>

      <div className="grid lg:grid-cols-2 gap-10 items-start mb-20">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Cristi, 19 ani — artist complet: de la versuri și producție până la imagine și brand. Peste
            <span className="text-[#f3c46a]"> 50 de milioane de vizualizări</span> și colaborări cu Nicolae Guță,
            Nek Music, Șușanu și 210 Production.
          </p>
          <p>
            De la remixuri toxice ale clasicelor genului, la <span className="text-[#f3c46a]">Manele Artificiale</span> —
            piese create cu inteligență artificială — BIOXIC împinge genul în viitor. Tot ce vezi aici, de la logo
            la videoclipuri, e creat de el.
          </p>
          <div className="glass rounded-sm p-8 mt-8">
            <p className="font-display text-xl sm:text-2xl font-bold leading-snug" data-testid="despre-quote">
              „Un tinerel în curs de <span className="text-[#f3c46a] text-glow">perfeționare</span>"
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-zinc-500">— Nicolae Guță</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative">
          <div className="relative rounded-sm overflow-hidden border border-white/10 scanlines">
            <img src={AI_IMG} alt="BIOXIC concept AI" className="w-full h-96 object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06110d] to-transparent" />
          </div>
          <div className="absolute -bottom-6 -right-2 sm:-right-6 w-40 h-40 rounded-sm overflow-hidden border border-[#f3c46a]/40 box-glow hidden sm:block">
            <img src={STAGE_IMG} alt="BIOXIC pe scenă" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>

      {/* COLABORĂRI */}
      <section className="mb-20">
        <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight mb-8">Colaborări</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLLABS.map((c, i) => (
            <motion.div key={c} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              data-testid={`collab-${i}`}
              className="glass rounded-sm p-8 text-center hover:border-[#f3c46a]/40 hover:box-glow transition-all">
              <p className="font-display font-bold text-xl tracking-wide">{c}</p>
              <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">[LOGO_{c.toUpperCase().replace(/ /g, "_")}]</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="mb-10">
        <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight mb-10">Cronologie</h2>
        <div className="relative pl-8 border-l border-[#f3c46a]/30 space-y-10">
          {TIMELINE.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              data-testid={`timeline-${i}`} className="relative">
              <span className="absolute -left-[37px] top-1 w-4 h-4 bg-[#06110d] border-2 border-[#f3c46a] rotate-45" />
              <p className="font-display font-bold text-[#f3c46a] text-sm uppercase tracking-widest flex items-center gap-2">
                {i === 0 && <Disc3 size={14} />}{i === 1 && <Youtube size={14} />}{i === 2 && <Bot size={14} />}{i === 3 && <Biohazard size={14} />}
                {t.year}
              </p>
              <p className="text-zinc-400 mt-2 max-w-xl">{t.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
