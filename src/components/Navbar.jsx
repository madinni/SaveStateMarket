import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const activeClass = "text-neon-pink flex flex-col items-center";
  const inactiveClass = "text-slate-500 hover:text-neon-cyan flex flex-col items-center transition-colors";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-noir-950/95 backdrop-blur-lg border-t border-noir-700/80 px-4 py-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="font-pixel text-lg">■</span>
          <span className="font-code text-[9px] tracking-tighter">EXCHANGE</span>
        </NavLink>
        <NavLink to="/offers" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="font-pixel text-lg">◈</span>
          <span className="font-code text-[9px] tracking-tighter">OFFERS</span>
        </NavLink>
        <Link to="/sell" className="bg-neon-pink text-white p-2.5 chamfer-box glow-pink hover:scale-105 active:scale-95 transition-all -mt-5 border border-white/20 flex items-center justify-center">
          <span className="font-code text-xs font-bold leading-none">+SELL</span>
        </Link>
        <NavLink to="/help" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="font-pixel text-lg">?</span>
          <span className="font-code text-[9px] tracking-tighter">HELP_LOG</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <span className="font-pixel text-lg">◉</span>
          <span className="font-code text-[9px] tracking-tighter">PROFILE</span>
        </NavLink>
      </div>
    </nav>
  );
}