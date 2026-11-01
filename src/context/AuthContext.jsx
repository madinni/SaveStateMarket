import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const API_URL = "http://localhost:3001";

const SESSION_KEY = "null_operative_session";

// Remove a senha antes de manter o operador em memória e no localStorage.
const toSession = (operative) => {
  const { password_hash, ...safe } = operative; // eslint-disable-line no-unused-vars
  return safe;
};

export const AuthProvider = ({ children }) => {
  const [isProfileSynced, setIsProfileSynced] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user?.id) {
      setIsProfileSynced(true);
      return undefined;
    }
    let active = true;
    setIsProfileSynced(false);
    fetch(`${API_URL}/profiles/${encodeURIComponent(user.id)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((operative) => {
        if (!active) return;
        const session = toSession(operative);
        setUser(session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      })
      .catch((error) => console.error("Falha ao atualizar o perfil autenticado:", error))
      .finally(() => {
        if (active) setIsProfileSynced(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const login = (operativeData) => {
    const session = toSession(operativeData);
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateAvatar = async (newBase64) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/profiles/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: newBase64 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      login(await res.json());
    } catch (e) {
      console.error("Falha ao atualizar avatar no json-server:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isProfileSynced, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
