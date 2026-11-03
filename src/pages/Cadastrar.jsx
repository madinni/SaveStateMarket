import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import AuthShell from "../components/AuthShell";
import FieldError from "../components/FieldError";
import ShippingAddressFields from "../components/ShippingAddressFields";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { registerSchema } from "../schemas";
import { EMPTY_SHIPPING_ADDRESS } from "../utils/address";

const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-white focus:outline-none focus:border-neon-cyan";

// Aula 11: /cadastrar é pública; POST /usuarios → 201 segue para /entrar; 409 mostra o campo em uso.
export default function Cadastrar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { handle: "", email: "", password: "", shipping_address: { ...EMPTY_SHIPPING_ADDRESS } },
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (created) => navigate("/entrar", { state: { registered: true, email: created.email } }),
    onError: (error) => {
      if (error.status === 409 && error.field) setError(error.field, { message: error.message });
    },
  });

  if (user) return <Navigate to="/profile" replace />;

  return (
    <AuthShell>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate
        className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-cyan space-y-4 font-code text-xs">
        <div>
          <label htmlFor="reg-handle" className="block text-[10px] text-slate-400 mb-1">// OPERATIVE_TAG (HANDLE)</label>
          <input id="reg-handle" type="text" placeholder="ex: K3nji_Zero" {...register("handle")} className={inputClass} />
          <FieldError error={errors.handle} />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-[10px] text-slate-400 mb-1">// NETWORK_IDENTIFIER (EMAIL)</label>
          <input id="reg-email" type="email" autoComplete="email" {...register("email")} className={inputClass} />
          <FieldError error={errors.email} />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-[10px] text-slate-400 mb-1">// CIPHER_KEY (SENHA)</label>
          <input id="reg-password" type="password" autoComplete="new-password" {...register("password")} className={inputClass} />
          <FieldError error={errors.password} />
        </div>
        <fieldset className="border-t border-noir-700 pt-4 space-y-3">
          <legend className="px-1 text-[10px] font-bold text-neon-cyan">ENDEREÇO PRINCIPAL DE ENTREGA *</legend>
          <ShippingAddressFields register={register} setValue={setValue} watch={watch} errors={errors} />
        </fieldset>

        {mutation.isError && !(mutation.error.status === 409 && mutation.error.field) && (
          <p role="alert" className="text-neon-pink font-bold">⚠ {mutation.error.message}</p>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-cyan text-noir-950 glow-cyan disabled:opacity-50">
          {mutation.isPending ? "REGISTRANDO..." : "CRIAR_OPERADOR >>"}
        </button>
      </form>
    </AuthShell>
  );
}
