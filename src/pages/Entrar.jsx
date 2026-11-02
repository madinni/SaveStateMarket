import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import AuthShell from "../components/AuthShell";
import FieldError from "../components/FieldError";
import ShippingAddressFields from "../components/ShippingAddressFields";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { loginSchema, shippingAddressFormSchema } from "../schemas";
import { EMPTY_SHIPPING_ADDRESS, hasShippingAddress } from "../utils/address";

const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none focus:border-neon-pink";

// Aula 11: /entrar é pública; POST /login → 200 guarda o token; 401 fica aqui.
export default function Entrar() {
  const { user, signIn, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [needsAddress, setNeedsAddress] = useState(false);
  const destino = location.state?.from?.pathname || "/profile";
  const registered = location.state?.registered;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: location.state?.email || "", password: "" },
  });
  const addressForm = useForm({
    resolver: zodResolver(shippingAddressFormSchema),
    defaultValues: { shipping_address: { ...EMPTY_SHIPPING_ADDRESS } },
  });

  const loginMutation = useMutation({
    mutationFn: async (values) => {
      const { token } = await authApi.login(values);
      return signIn(token);
    },
    onSuccess: (profile) => {
      // Contas antigas sem endereço completam o cadastro antes de seguir.
      if (hasShippingAddress(profile.shipping_address)) navigate(destino, { replace: true });
      else setNeedsAddress(true);
    },
  });

  const addressMutation = useMutation({
    mutationFn: (shipping_address) => authApi.updateMe({ shipping_address }),
    onSuccess: (profile) => {
      login(profile);
      navigate(destino, { replace: true });
    },
  });

  // Quem já está logado não precisa ver a tela (exceto durante o próprio login).
  const loggingIn = loginMutation.isPending || loginMutation.isSuccess;
  if (user && !needsAddress && !loggingIn) return <Navigate to={destino} replace />;

  return (
    <AuthShell>
      {registered && !needsAddress && (
        <p role="status" className="font-code text-[11px] font-bold text-neon-mint border border-neon-mint/40 bg-noir-900 p-3">
          ✓ Operador criado. Entre com o e-mail e a senha cadastrados.
        </p>
      )}

      {!needsAddress ? (
        <form onSubmit={handleSubmit((values) => loginMutation.mutate(values))} noValidate
          className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-pink space-y-4 font-code text-xs">
          <div>
            <label htmlFor="login-email" className="block text-[10px] text-slate-400 mb-1">// NETWORK_IDENTIFIER (EMAIL)</label>
            <input id="login-email" type="email" autoComplete="email" {...register("email")} className={inputClass} />
            <FieldError error={errors.email} />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-[10px] text-slate-400 mb-1">// CIPHER_KEY (SENHA)</label>
            <input id="login-password" type="password" autoComplete="current-password" {...register("password")} className={inputClass} />
            <FieldError error={errors.password} />
          </div>

          {loginMutation.isError && (
            <p role="alert" className="text-neon-pink font-bold">⚠ {loginMutation.error.message}</p>
          )}

          <button type="submit" disabled={loginMutation.isPending}
            className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-pink text-white glow-pink disabled:opacity-50">
            {loginMutation.isPending ? "AUTENTICANDO..." : "AUTORIZAR_ACESSO >>"}
          </button>
        </form>
      ) : (
        <form onSubmit={addressForm.handleSubmit(({ shipping_address }) => addressMutation.mutate(shipping_address))} noValidate
          className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box space-y-3 font-code text-xs">
          <div>
            <h2 className="text-[11px] font-bold text-neon-amber">ENDEREÇO DE ENTREGA OBRIGATÓRIO</h2>
            <p className="mt-1 text-[10px] text-slate-400">Complete seu endereço para entrar e realizar compras.</p>
          </div>
          <ShippingAddressFields register={addressForm.register} errors={addressForm.formState.errors} prefix="login-shipping" />
          {addressMutation.isError && <p role="alert" className="text-neon-pink font-bold">⚠ {addressMutation.error.message}</p>}
          <button type="submit" disabled={addressMutation.isPending}
            className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-cyan text-noir-950 disabled:opacity-50">
            {addressMutation.isPending ? "SALVANDO ENDEREÇO..." : "SALVAR E ENTRAR >>"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
