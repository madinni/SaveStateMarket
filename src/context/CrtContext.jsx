import React, { createContext, useContext, useState } from "react";

const CrtContext = createContext({ crtEnabled: true, toggleCrt: () => {} });

const STORAGE_KEY = "null_crt_enabled";

// O filtro CRT (scanlines e brilhos) pode ser desligado por acessibilidade.
// A preferência fica salva no navegador.
const readPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

export function CrtProvider({ children }) {
  const [crtEnabled, setCrtEnabled] = useState(readPreference);

  const toggleCrt = () =>
    setCrtEnabled((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* sem localStorage: a escolha vale só nesta sessão */
      }
      return next;
    });

  return <CrtContext.Provider value={{ crtEnabled, toggleCrt }}>{children}</CrtContext.Provider>;
}

export const useCrt = () => useContext(CrtContext);
