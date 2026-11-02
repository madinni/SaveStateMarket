import React, { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "../services/api";

export { API_URL } from "../config";

const AuthContext = createContext();

const SESSION_KEY = "null_operative_session";

// Remove a senha antes de manter o operador em memória e no localStorage.
const toSession = (operative) => {
  const { password_hash, ...safe } = operative; // eslint-disable-line no-unused-vars
  return safe;
};

export const AuthProvider = ({ children }) => {
  const [isProfileSynced, setIsProfileSynced] = useState(false);
  const queryClient = useQueryClient();
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
      .catch((error) =>
        console.error("Falha ao atualizar o perfil autenticado:", error),
      )
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

  const avatarMutation = useMutation({
    mutationFn: (avatar_url) => profilesApi.update(user.id, { avatar_url }),
    onSuccess: (updated) => {
      login(updated);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  // Lança erro em caso de falha, para a tela exibir a mensagem.
  const updateAvatar = async (newBase64) => {
    if (!user) return;
    await avatarMutation.mutateAsync(newBase64);
  };

  return (
    <AuthContext.Provider
      value={{ user, isProfileSynced, login, logout, updateAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
