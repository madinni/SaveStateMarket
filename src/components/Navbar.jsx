import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUnreadCount } from "../hooks/useNotifications";

const activeClass = "text-neon-pink flex flex-col items-center";
const inactiveClass =
  "text-slate-500 hover:text-neon-cyan flex flex-col items-center transition-colors";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);
  const linkClass = ({ isActive }) => (isActive ? activeClass : inactiveClass);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-noir-950/95 backdrop-blur-lg border-t border-noir-700/80 px-4 py-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavLink to="/" className={linkClass}>
          <span className="font-pixel text-lg">■</span>
          <span className="font-code text-[9px] tracking-tighter">
            EXCHANGE
          </span>
        </NavLink>
        <NavLink to="/offers" className={linkClass}>
          <span className="font-pixel text-lg">◈</span>
          <span className="font-code text-[9px] tracking-tighter">OFFERS</span>
        </NavLink>
        <NavLink
          to="/checkout"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <span className="font-pixel text-lg">▣</span>
          <span className="font-code text-[9px] tracking-tighter">
            CART{itemCount ? ` ${itemCount}` : ""}
          </span>
        </NavLink>
        <Link
          to="/sell"
          className="bg-neon-pink text-white p-2.5 chamfer-box glow-pink hover:scale-105 active:scale-95 transition-all -mt-5 border border-white/20 flex items-center justify-center"
        >
          <span className="font-code text-xs font-bold leading-none">
            +SELL
          </span>
        </Link>
        <NavLink
          to="/notifications"
          className={linkClass}
          aria-label="Notificações"
        >
          <span className="relative font-pixel text-lg">
            ◆
            {unread > 0 && (
              <span className="absolute -top-1 -right-3 min-w-[14px] h-[14px] px-0.5 bg-neon-pink text-white text-[9px] font-code leading-[14px] text-center rounded-full">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </span>
          <span className="font-code text-[9px] tracking-tighter">ALERTS</span>
        </NavLink>
        <NavLink to="/help" className={linkClass}>
          <span className="font-pixel text-lg">?</span>
          <span className="font-code text-[9px] tracking-tighter">
            HELP_LOG
          </span>
        </NavLink>
        {user?.role === "admin" && (
          <NavLink to="/admin" className={linkClass}>
            <span className="font-pixel text-lg">#</span>
            <span className="font-code text-[9px] tracking-tighter">ADMIN</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={linkClass}>
          <span className="font-pixel text-lg">◉</span>
          <span className="font-code text-[9px] tracking-tighter">PROFILE</span>
        </NavLink>
      </div>
    </nav>
  );
}
