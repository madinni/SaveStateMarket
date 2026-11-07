import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/api";
import { clearToken, getToken, setToken } from "../services/tokenStorage";
import { notify } from "../utils/toast";

export { API_URL } from "../config";

const AuthContext = createContext(null);
const ME_KEY = ["me"];

// O token fica no localStorage; os dados do usuário vêm sempre de GET /usuarios/me.
export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState(getToken);

  const meQuery = useQuery({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
    staleTime: 30_000,
  });

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    queryClient.clear(); // nada do usuário anterior fica em cache
  }, [queryClient]);

  // Guarda o token recebido no login e carrega o perfil antes de liberar as telas.
  const signIn = useCallback(
    async (newToken) => {
      setToken(newToken);
      try {
        const me = await queryClient.fetchQuery({ queryKey: ME_KEY, queryFn: authApi.me });
        setTokenState(newToken);
        return me;
      } catch (error) {
        clearToken();
        throw error;
      }
    },
    [queryClient],
  );

  // Troca o token da sessão atual sem recarregar o perfil (ex.: a troca de senha devolve
  // um token novo e derruba os anteriores).
  const replaceToken = useCallback((newToken) => {
    if (!newToken) return;
    setToken(newToken);
    setTokenState(newToken);
  }, []);

  // Atualiza o usuário em cache com o perfil devolvido pela API.
  const login = useCallback(
    (profile) => {
      if (profile) queryClient.setQueryData(ME_KEY, profile);
    },
    [queryClient],
  );

  useEffect(() => {
    const onUnauthorized = () => logout();
    const onRefresh = () => queryClient.invalidateQueries({ queryKey: ME_KEY });
    window.addEventListener("auth:unauthorized", onUnauthorized);
    window.addEventListener("auth:refresh", onRefresh);
    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
      window.removeEventListener("auth:refresh", onRefresh);
    };
  }, [logout, queryClient]);

  const avatarMutation = useMutation({
    mutationFn: (avatar_url) => authApi.updateMe({ avatar_url }),
    onSuccess: (updated) => {
      login(updated);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  // Avisa o usuário por toast e relança o erro, para a tela também exibir a mensagem inline.
  const updateAvatar = async (newBase64) => {
    if (!token) return;
    try {
      await avatarMutation.mutateAsync(newBase64);
      notify.success("Foto de perfil atualizada.");
    } catch (error) {
      notify.error(`Não foi possível atualizar a foto: ${error.message || "erro desconhecido."}`);
      throw error;
    }
  };

  const user = token ? meQuery.data ?? null : null;
  const isProfileSynced = !token || !meQuery.isFetching;

  // Enquanto o token é conferido na primeira carga, as telas não decidem nada.
  if (token && meQuery.isPending) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center font-code text-xs text-neon-cyan animate-pulse">
        VALIDANDO_SESSÃO...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isProfileSynced, signIn, login, logout, updateAvatar, replaceToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
