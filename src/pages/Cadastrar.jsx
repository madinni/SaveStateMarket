import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthShell from "../components/AuthShell";
import FieldError from "../components/FieldError";
import ShippingAddressFields from "../components/ShippingAddressFields";
import { useAuth } from "../context/AuthContext";
import { useRegister } from "../hooks/useAuthActions";
import { registerSchema } from "../schemas";
import { EMPTY_SHIPPING_ADDRESS } from "../utils/address";
import { notify } from "../utils/toast";

const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan";
const labelClass = "block text-xs text-slate-300 mb-1";
const FORM_FIELDS = ["handle", "email", "password"];

// Aula 11: /cadastrar é pública; POST /usuarios → 201 segue para /entrar; 409 mostra o campo em uso.
export default function Cadastrar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, setError, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { handle: "", email: "", password: "", shipping_address: { ...EMPTY_SHIPPING_ADDRESS } },
  });
  const registerMutation = useRegister();

  if (user) return <Navigate to="/profile" replace />;

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      const created = await registerMutation.mutateAsync(values);
      notify.success("Conta criada. Entre com seu e-mail e senha.");
      navigate("/entrar", { state: { registered: true, email: created.email } });
    } catch (err) {
      // Erro com campo (ex.: 409 e-mail ou handle em uso) vai para o próprio campo.
      if (err.field && (FORM_FIELDS.includes(err.field) || err.field.startsWith("shipping_address."))) {
        setError(err.field, { message: err.message });
      } else {
        setSubmitError(err.message);
      }
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} noValidate
        className="bg-noir-900/90 border border-noir-700 p-5 chamfer-box glow-cyan space-y-4 font-code text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-handle" className={labelClass}>// NOME DE USUÁRIO</label>
            <input id="reg-handle" type="text" placeholder="ex: K3nji_Zero" {...register("handle")} className={inputClass} />
            <FieldError error={errors.handle} />
          </div>
          <div>
            <label htmlFor="reg-email" className={labelClass}>// E-MAIL</label>
            <input id="reg-email" type="email" autoComplete="email" {...register("email")} className={inputClass} />
            <FieldError error={errors.email} />
          </div>
        </div>
        <div>
          <label htmlFor="reg-password" className={labelClass}>// SENHA</label>
          <input id="reg-password" type="password" autoComplete="new-password" {...register("password")} className={inputClass} />
          <FieldError error={errors.password} />
        </div>
        <fieldset className="border-t border-noir-700 pt-4 space-y-3">
          <legend className="px-1 text-xs font-bold text-neon-cyan">ENDEREÇO PRINCIPAL DE ENTREGA *</legend>
          <ShippingAddressFields register={register} setValue={setValue} watch={watch} errors={errors} />
        </fieldset>

        {submitError && <p role="alert" className="text-neon-pink font-bold">⚠ {submitError}</p>}

        <button type="submit" disabled={registerMutation.isPending}
          className="w-full py-3 font-bold uppercase chamfer-box tracking-widest bg-neon-cyan text-noir-950 glow-cyan disabled:opacity-50">
          {registerMutation.isPending ? "CRIANDO CONTA..." : "CRIAR CONTA >>"}
        </button>
      </form>
    </AuthShell>
  );
}
