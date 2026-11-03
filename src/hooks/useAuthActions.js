import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

// POST /login → guarda o token pelo AuthContext e devolve o perfil de /usuarios/me.
// Erros da API (401 credenciais, 429 excesso de tentativas) chegam como ApiError.
export const useLogin = () => {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: async (credentials) => {
      const { token } = await authApi.login(credentials);
      return signIn(token);
    },
  });
};

// POST /usuarios. Conflitos (409) chegam com o campo em ApiError.field.
export const useRegister = () => useMutation({ mutationFn: authApi.register });

// PATCH /usuarios/me (avatar/endereço). Atualiza o usuário em cache e os perfis públicos.
export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  const { login } = useAuth();
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (profile) => {
      login(profile);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
};
