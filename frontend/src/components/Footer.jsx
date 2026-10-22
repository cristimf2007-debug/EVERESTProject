import React from "react";
import { Youtube, Instagram, Music2, MessageCircle, AudioLines } from "lucide-react";
import { Link } from "react-router-dom";
import { DiscordIcon, DISCORD_URL } from "@/components/DiscordButton";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative z-10 border-t border-white/10 bg-[#050805] mt-24 mb-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="font-display font-black text-2xl text-[#39FF14] tracking-tighter">BIOXIC</p>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs">Manele Remixate &amp; Manele Artificiale. No risks, no hits.</p>
          </div>
          <div className="flex items-center gap-5">
            <a data-testid="footer-youtube" href="https://www.youtube.com/@djbioxic" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="YouTube"><Youtube size={22} /></a>
            <a data-testid="footer-spotify" href="https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="Spotify"><AudioLines size={22} /></a>
            <a data-testid="footer-tiktok" href="https://www.tiktok.com/@bioxic.exe" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="TikTok"><Music2 size={22} /></a>
            <a data-testid="footer-instagram" href="https://www.instagram.com/crss.exe_" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="Instagram"><Instagram size={22} /></a>
            <a data-testid="footer-discord" href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#5865F2] transition-colors" aria-label="Discord"><DiscordIcon size={22} /></a>
            <a data-testid="footer-whatsapp" href="https://wa.me/447400998964" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="WhatsApp"><MessageCircle size={22} /></a>
          </div>
          <div className="flex flex-col gap-2 text-xs text-zinc-500 uppercase tracking-widest">
            <Link to="/muzica" className="hover:text-[#39FF14] transition-colors">Muzică</Link>
            <Link to="/live" className="hover:text-[#39FF14] transition-colors">Live</Link>
            <Link to="/contact" className="hover:text-[#39FF14] transition-colors">Booking</Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} BIOXIC. Toate drepturile rezervate.</p>
          <p className="text-[#00C853]/70">Powered by Manele Artificiale</p>
        </div>
      </div>
    </footer>
  );
}
