import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { profilesApi } from "../services/api";
import { loginSchema, registerSchema } from "../schemas";
import FieldError from "../components/FieldError";

const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none";

async function authenticate({ email, password }) {
  const users = await profilesApi.findByEmail(email);
  const found = users.find((u) => u.password_hash === password);
  if (!found) throw new Error("Credenciais inválidas.");
  return found;
}

async function registerOperative({ handle, email, password }) {
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
    reputation: 5.0,
    total_transactions: 0,
    success_rate: 100,
    vault_balance: 0,
    clearance_level: "LEVEL_3",
  });
}

function LoginForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({ mutationFn: authenticate, onSuccess });

  return (
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
  );
}

function RegisterForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { handle: "", email: "", password: "" },
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
        <span className="text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag">PORT: 3001</span>
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
