import React, { useState } from "react";
import CrtToggle from "../components/CrtToggle";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { profilesApi } from "../services/api";
import { loginSchema, registerSchema, shippingAddressFormSchema } from "../schemas";
import FieldError from "../components/FieldError";
import ShippingAddressFields from "../components/ShippingAddressFields";
import { EMPTY_SHIPPING_ADDRESS, hasShippingAddress } from "../utils/address";

const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none";

async function authenticate({ email, password }) {
  const users = await profilesApi.findByEmail(email);
  const found = users.find((u) => u.password_hash === password);
  if (!found) throw new Error("Credenciais inválidas.");
  return found;
}

async function registerOperative({ handle, email, password, shipping_address }) {
  const finalHandle = handle.startsWith("@") ? handle : `@${handle}`;

  const [sameEmail, sameHandle] = await Promise.all([
    profilesApi.findByEmail(email),
    profilesApi.findByHandle(finalHandle),
  ]);
  if (sameEmail.length > 0) throw new Error("Este e-mail já está cadastrado.");
  if (sameHandle.length > 0) throw new Error("Este handle já está em uso.");

  return profilesApi.create({
    handle: finalHandle,
    email,
    password_hash: password,
    shipping_address,
    reputation: 5.0,
    total_transactions: 0,
    success_rate: 100,
    vault_balance: 0,
    clearance_level: "LEVEL_3",
  });
}

function LoginForm({ onSuccess }) {
  const [profileNeedingAddress, setProfileNeedingAddress] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const addressForm = useForm({
    resolver: zodResolver(shippingAddressFormSchema),
    defaultValues: { shipping_address: { ...EMPTY_SHIPPING_ADDRESS } },
  });
  const mutation = useMutation({
    mutationFn: authenticate,
    onSuccess: (operative) => {
      if (hasShippingAddress(operative.shipping_address)) onSuccess(operative);
      else setProfileNeedingAddress(operative);
    },
  });
  const addressMutation = useMutation({
    mutationFn: (shipping_address) => profilesApi.update(profileNeedingAddress.id, { shipping_address }),
    onSuccess: onSuccess,
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
        className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-pink space-y-4 font-code text-xs"
      >
        <div>
          <label htmlFor="login-email" className="block text-[10px] text-slate-400 mb-1">
            // NETWORK_IDENTIFIER (EMAIL)
          </label>
          <input id="login-email" type="email" autoComplete="email" {...register("email")}
            className={`${inputClass} focus:border-neon-pink`} />
          <FieldError error={errors.email} />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-[10px] text-slate-400 mb-1">
            // CIPHER_KEY (SENHA)
          </label>
          <input id="login-password" type="password" autoComplete="current-password" {...register("password")}
            className={`${inputClass} focus:border-neon-pink`} />
          <FieldError error={errors.password} />
        </div>

        {mutation.isError && (
          <p role="alert" className="text-neon-pink font-bold">⚠ {mutation.error.message}</p>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-pink text-white glow-pink disabled:opacity-50">
          {mutation.isPending ? "AUTENTICANDO..." : "AUTORIZAR_ACESSO >>"}
        </button>
      </form>
      {profileNeedingAddress && (
        <form onSubmit={addressForm.handleSubmit(({ shipping_address }) => addressMutation.mutate(shipping_address))} noValidate className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box space-y-3 font-code text-xs">
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
    </div>
  );
}

function RegisterForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { handle: "", email: "", password: "", shipping_address: EMPTY_SHIPPING_ADDRESS },
  });
  const mutation = useMutation({ mutationFn: registerOperative, onSuccess });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-cyan space-y-4 font-code text-xs"
    >
      <div>
        <label htmlFor="reg-handle" className="block text-[10px] text-slate-400 mb-1">
          // OPERATIVE_TAG (HANDLE)
        </label>
        <input id="reg-handle" type="text" placeholder="ex: K3nji_Zero" {...register("handle")}
          className={`${inputClass} focus:border-neon-cyan`} />
        <FieldError error={errors.handle} />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-[10px] text-slate-400 mb-1">
          // NETWORK_IDENTIFIER (EMAIL)
        </label>
        <input id="reg-email" type="email" autoComplete="email" {...register("email")}
          className={`${inputClass} focus:border-neon-cyan`} />
        <FieldError error={errors.email} />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-[10px] text-slate-400 mb-1">
          // CIPHER_KEY (SENHA)
        </label>
        <input id="reg-password" type="password" autoComplete="new-password" {...register("password")}
          className={`${inputClass} focus:border-neon-cyan`} />
        <FieldError error={errors.password} />
      </div>
      <fieldset className="border-t border-noir-700 pt-4 space-y-3">
        <legend className="px-1 text-[10px] font-bold text-neon-cyan">ENDEREÇO PRINCIPAL DE ENTREGA *</legend>
        <ShippingAddressFields register={register} errors={errors} />
      </fieldset>

      {mutation.isError && (
        <p role="alert" className="text-neon-pink font-bold">⚠ {mutation.error.message}</p>
      )}

      <button type="submit" disabled={mutation.isPending}
        className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-cyan text-noir-950 glow-cyan disabled:opacity-50">
        {mutation.isPending ? "REGISTRANDO..." : "CRIAR_OPERADOR >>"}
      </button>
    </form>
  );
}

export default function AuthLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = (operative) => {
    login(operative);
    navigate("/profile");
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col justify-between text-slate-200">
      <header className="flex justify-between items-center text-xs font-code pb-4 border-b border-noir-800">
        <Link to="/" className="text-neon-cyan hover:text-white">&lt;&lt; RETURN_TO_FEED</Link>
        <div className="flex items-center space-x-2">
          <CrtToggle />
          <span className="text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag">PORT: 3001</span>
        </div>
      </header>

      <main className="space-y-6">
        <div className="text-center">
          <span className="font-pixel text-4xl text-white tracking-widest block">
            NULL<span className="text-neon-pink">//</span>AUTH
          </span>
          <span className="font-code text-[9px] text-neon-cyan tracking-widest block uppercase">
            District Protocol :: Clearance Required
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-noir-900 p-1 border border-noir-700 font-code text-xs">
          <button type="button" onClick={() => setIsRegister(false)}
            className={`py-2 chamfer-tag font-bold ${!isRegister ? "bg-neon-pink text-white glow-pink" : "text-slate-400"}`}>
            [LOGIN]
          </button>
          <button type="button" onClick={() => setIsRegister(true)}
            className={`py-2 chamfer-tag font-bold ${isRegister ? "bg-neon-cyan text-noir-950 glow-cyan" : "text-slate-400"}`}>
            [NOVO_OPERADOR]
          </button>
        </div>

        {isRegister ? (
          <RegisterForm onSuccess={handleSuccess} />
        ) : (
          <LoginForm onSuccess={handleSuccess} />
        )}
      </main>

      <footer className="text-center font-code text-[9px] text-slate-600 pt-4">
        PROJECT_NULL // AUTH_PROTOCOL © 2026
      </footer>
    </div>
  );
}
