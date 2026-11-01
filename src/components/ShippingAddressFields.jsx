import React from "react";
import FieldError from "./FieldError";

const inputClass = "w-full bg-noir-950 border border-noir-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan";

export default function ShippingAddressFields({ register, errors, prefix = "shipping_address", fieldPath = "shipping_address" }) {
  const addressError = errors?.shipping_address || errors;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${prefix}-postal-code`} className="mb-1 block text-[10px] text-slate-400">CEP</label>
        <input id={`${prefix}-postal-code`} autoComplete="postal-code" maxLength={9} {...register(`${fieldPath}.postal_code`)} className={inputClass} />
        <FieldError error={addressError?.postal_code} />
      </div>
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <div>
          <label htmlFor={`${prefix}-street`} className="mb-1 block text-[10px] text-slate-400">RUA / AVENIDA</label>
          <input id={`${prefix}-street`} autoComplete="address-line1" {...register(`${fieldPath}.street`)} className={inputClass} />
          <FieldError error={addressError?.street} />
        </div>
        <div>
          <label htmlFor={`${prefix}-number`} className="mb-1 block text-[10px] text-slate-400">NÚMERO</label>
          <input id={`${prefix}-number`} autoComplete="off" {...register(`${fieldPath}.number`)} className={inputClass} />
          <FieldError error={addressError?.number} />
        </div>
      </div>
      <div>
        <label htmlFor={`${prefix}-complement`} className="mb-1 block text-[10px] text-slate-400">COMPLEMENTO (OPCIONAL)</label>
        <input id={`${prefix}-complement`} autoComplete="address-line2" {...register(`${fieldPath}.complement`)} className={inputClass} />
        <FieldError error={addressError?.complement} />
      </div>
      <div>
        <label htmlFor={`${prefix}-neighborhood`} className="mb-1 block text-[10px] text-slate-400">BAIRRO</label>
        <input id={`${prefix}-neighborhood`} autoComplete="address-level3" {...register(`${fieldPath}.neighborhood`)} className={inputClass} />
        <FieldError error={addressError?.neighborhood} />
      </div>
      <div className="grid grid-cols-[1fr_4rem] gap-2">
        <div>
          <label htmlFor={`${prefix}-city`} className="mb-1 block text-[10px] text-slate-400">CIDADE</label>
          <input id={`${prefix}-city`} autoComplete="address-level2" {...register(`${fieldPath}.city`)} className={inputClass} />
          <FieldError error={addressError?.city} />
        </div>
        <div>
          <label htmlFor={`${prefix}-state`} className="mb-1 block text-[10px] text-slate-400">UF</label>
          <input id={`${prefix}-state`} autoComplete="address-level1" maxLength={2} {...register(`${fieldPath}.state`)} className={inputClass} />
          <FieldError error={addressError?.state} />
        </div>
      </div>
    </div>
  );
}