import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthShell from "../components/AuthShell";
import FieldError from "../components/FieldError";
import LoginError from "../components/LoginError";
import ShippingAddressFields from "../components/ShippingAddressFields";
import { useAuth } from "../context/AuthContext";
import { useLogin, useUpdateMe } from "../hooks/useAuthActions";
import { loginSchema, shippingAddressFormSchema } from "../schemas";
import { EMPTY_SHIPPING_ADDRESS, hasShippingAddress } from "../utils/address";
import { notify } from "../utils/toast";

const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-pink";

// Aula 11: /entrar é pública; POST /login → 200 guarda o token; 401 fica aqui.
export default function Entrar() {
  const { user } = useAuth();
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

  const loginMutation = useLogin();
  const addressMutation = useUpdateMe();

  const onLogin = (values) =>
    loginMutation.mutate(values, {
      onSuccess: (profile) => {
        notify.success(`Bem-vindo(a), ${profile.handle}.`);
        // O administrador vai direto para o painel (não compra, então não precisa de endereço).
        if (profile.role === "admin") navigate("/admin", { replace: true });
        // Contas antigas sem endereço completam o cadastro antes de seguir.
        else if (hasShippingAddress(profile.shipping_address)) navigate(destino, { replace: true });
        else setNeedsAddress(true);
      },
    });

  const onSaveAddress = ({ shipping_address }) =>
    addressMutation.mutate({ shipping_address }, {
      onSuccess: () => {
        notify.success("Endereço salvo.");
        navigate(destino, { replace: true });
      },
    });

  // Quem já está logado não precisa ver a tela (exceto durante o próprio login).
  const loggingIn = loginMutation.isPending || loginMutation.isSuccess;
  if (user && !needsAddress && !loggingIn) {
    return <Navigate to={user.role === "admin" ? "/admin" : destino} replace />;
  }

  return (
    <AuthShell>
      {registered && !needsAddress && (
        <p role="status" className="font-code text-xs font-bold text-neon-mint border border-neon-mint/40 bg-noir-900 p-3">
          ✓ Conta criada. Entre com o e-mail e a senha cadastrados.
        </p>
      )}

      {!needsAddress ? (
        <form onSubmit={handleSubmit(onLogin)} noValidate
          className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-pink space-y-4 font-code text-xs">
          <div>
            <label htmlFor="login-email" className="block text-xs text-slate-300 mb-1">// E-MAIL</label>
            <input id="login-email" type="text" inputMode="email" autoCapitalize="none" autoComplete="username" {...register("email")} className={inputClass} />
            <FieldError error={errors.email} />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs text-slate-300 mb-1">// SENHA</label>
            <input id="login-password" type="password" autoComplete="current-password" {...register("password")} className={inputClass} />
            <FieldError error={errors.password} />
          </div>

          {loginMutation.isError && <LoginError error={loginMutation.error} />}

          <button type="submit" disabled={loginMutation.isPending}
            className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-pink text-white glow-pink disabled:opacity-50">
            {loginMutation.isPending ? "ENTRANDO..." : "ENTRAR >>"}
          </button>
        </form>
      ) : (
        <form onSubmit={addressForm.handleSubmit(onSaveAddress)} noValidate
          className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box space-y-3 font-code text-xs">
          <div>
            <h2 className="text-sm font-bold text-neon-amber">ENDEREÇO DE ENTREGA OBRIGATÓRIO</h2>
            <p className="mt-1 text-xs text-slate-400">Complete seu endereço para entrar e realizar compras.</p>
          </div>
          <ShippingAddressFields register={addressForm.register} setValue={addressForm.setValue} watch={addressForm.watch} errors={addressForm.formState.errors} prefix="login-shipping" />
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
