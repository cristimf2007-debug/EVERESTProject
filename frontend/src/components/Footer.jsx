import React from "react";
import { Youtube, Instagram, Music2, AudioLines } from "lucide-react";
import { Link } from "react-router-dom";
import { DiscordIcon, DISCORD_URL } from "@/components/DiscordButton";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative z-10 mt-20 mb-28 border-t border-[rgba(234,242,237,0.11)]">
      <div className="max-w-[1120px] mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-5">
        <p className="text-xs text-[#6c8378]">© 2026 BIOXIC · Toate piesele din seif sunt exclusive site-ului.</p>
        <div className="flex items-center gap-4">
          <a data-testid="footer-youtube" href="https://www.youtube.com/@djbioxic" target="_blank" rel="noopener noreferrer" className="text-[#9db3a8] hover:text-[#f3c46a] transition-colors" aria-label="YouTube"><Youtube size={19} /></a>
          <a data-testid="footer-tiktok" href="https://www.tiktok.com/@bioxic.exe" target="_blank" rel="noopener noreferrer" className="text-[#9db3a8] hover:text-[#f3c46a] transition-colors" aria-label="TikTok"><Music2 size={19} /></a>
          <a data-testid="footer-instagram" href="https://www.instagram.com/crss.exe_" target="_blank" rel="noopener noreferrer" className="text-[#9db3a8] hover:text-[#f3c46a] transition-colors" aria-label="Instagram"><Instagram size={19} /></a>
          <a data-testid="footer-spotify" href="https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK" target="_blank" rel="noopener noreferrer" className="text-[#9db3a8] hover:text-[#f3c46a] transition-colors" aria-label="Spotify"><AudioLines size={19} /></a>
          <a data-testid="footer-discord" href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-[#9db3a8] hover:text-[#5865F2] transition-colors" aria-label="Discord"><DiscordIcon size={19} /></a>
        </div>
        <p className="text-xs text-[#f3c46a]/70">Sărbători fericite ✦</p>
      </div>
    </footer>
  );
}
