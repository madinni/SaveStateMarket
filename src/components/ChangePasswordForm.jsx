import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FieldError from "./FieldError";
import { useChangePassword } from "../hooks/useAuthActions";
import { changePasswordSchema } from "../schemas";
import { notify } from "../utils/toast";

const DEFAULTS = { current_password: "", new_password: "", confirm_password: "" };
const API_FIELDS = ["current_password", "new_password"];
const inputClass =
  "w-full bg-noir-950 border border-noir-700 px-3 py-2.5 text-sm text-white font-code focus:outline-none focus:border-neon-cyan";
const labelClass = "block text-xs text-slate-300 mb-1";

// Seção "Segurança" do perfil (e do painel do admin): PATCH /usuarios/me/senha.
// A confirmação fica só no formulário; a API recebe { current_password, new_password }.
export default function ChangePasswordForm({ idPrefix = "pwd" }) {
  const changePassword = useChangePassword();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: DEFAULTS,
  });

  const onSubmit = async ({ current_password, new_password }) => {
    try {
      const result = await changePassword.mutateAsync({ current_password, new_password });
      reset(DEFAULTS);
      notify.success(result?.message || "Senha alterada.");
    } catch (err) {
      // Ex.: 400 com field "current_password" quando a senha atual está errada.
      if (API_FIELDS.includes(err.field)) setError(err.field, { message: err.message });
    }
  };

  const generalError =
    changePassword.isError && !API_FIELDS.includes(changePassword.error.field) ? changePassword.error : null;

  return (
    <section aria-labelledby={`${idPrefix}-title`} className="bg-noir-900 border border-noir-700 p-4 chamfer-box space-y-3 font-code">
      <div>
        <h2 id={`${idPrefix}-title`} className="text-sm font-bold text-neon-cyan">SEGURANÇA · ALTERAR SENHA</h2>
        <p className="mt-1 text-xs text-slate-400">A nova senha precisa ter de 8 a 72 caracteres e ser diferente da atual.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div>
          <label htmlFor={`${idPrefix}-current`} className={labelClass}>SENHA ATUAL</label>
          <input id={`${idPrefix}-current`} type="password" autoComplete="current-password" {...register("current_password")} className={inputClass} />
          <FieldError error={errors.current_password} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-new`} className={labelClass}>NOVA SENHA</label>
            <input id={`${idPrefix}-new`} type="password" autoComplete="new-password" {...register("new_password")} className={inputClass} />
            <FieldError error={errors.new_password} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-confirm`} className={labelClass}>CONFIRMAR NOVA SENHA</label>
            <input id={`${idPrefix}-confirm`} type="password" autoComplete="new-password" {...register("confirm_password")} className={inputClass} />
            <FieldError error={errors.confirm_password} />
          </div>
        </div>
        {generalError && (
          <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {generalError.message}</p>
        )}
        <button type="submit" disabled={changePassword.isPending}
          className="w-full py-2.5 bg-neon-cyan text-noir-950 text-sm font-bold chamfer-tag disabled:opacity-50">
          {changePassword.isPending ? "SALVANDO…" : "ALTERAR SENHA"}
        </button>
      </form>
    </section>
  );
}
