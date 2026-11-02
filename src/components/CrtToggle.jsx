import React from "react";
import { useCrt } from "../context/CrtContext";

export default function CrtToggle() {
  const { crtEnabled, toggleCrt } = useCrt();
  const label = crtEnabled ? "Desativar filtro CRT" : "Ativar filtro CRT";

  return (
    <button
      type="button"
      onClick={toggleCrt}
      aria-pressed={crtEnabled}
      aria-label={label}
      title={label}
      className={`shrink-0 px-2 py-1 border text-[10px] font-code font-bold chamfer-tag transition-colors ${
        crtEnabled
          ? "bg-noir-900 border-neon-amber text-neon-amber hover:bg-neon-amber/10"
          : "bg-noir-800 border-slate-500 text-slate-300 hover:border-neon-amber"
      }`}
    >
      CRT: {crtEnabled ? "ON" : "OFF"}
    </button>
  );
}
