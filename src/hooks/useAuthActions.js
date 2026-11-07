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

// PATCH /usuarios/me/senha. A senha atual errada volta como 400 com field "current_password";
// excesso de tentativas, 429. A troca revoga os tokens antigos e a API devolve um token novo,
// que fica gravado para a sessão atual continuar.
export const useChangePassword = () => {
  const { replaceToken } = useAuth();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (result) => replaceToken(result?.token),
  });
};
