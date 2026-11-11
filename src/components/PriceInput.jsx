import React, { forwardRef } from "react";
import { formatPriceText, parsePrice, sanitizePrice } from "../utils/price";

// As regras de vírgula/ponto (padrão pt-BR) ficam em utils/price.js.
export { formatPriceText, parsePrice, sanitizePrice };

// Campo de valor em R$ sem as setas do type="number". Funciona com register() do
// react-hook-form (repassa ref/onChange/onBlur/name) ou como campo controlado (value/onChange).
// Ao sair do campo, o texto é reescrito no padrão pt-BR ("12.50" → "12,50", "1500" → "1.500"),
// para o usuário ver como o valor foi entendido.
const PriceInput = forwardRef(function PriceInput({ onChange, onBlur, ...props }, ref) {
  const handleChange = (event) => {
    const clean = sanitizePrice(event.target.value);
    if (clean !== event.target.value) event.target.value = clean;
    onChange?.(event);
  };

  const handleBlur = (event) => {
    const formatted = formatPriceText(event.target.value);
    if (formatted !== event.target.value) {
      event.target.value = formatted;
      onChange?.(event);
    }
    onBlur?.(event);
  };

  return (
    <input ref={ref} type="text" inputMode="decimal" autoComplete="off" {...props}
      onChange={handleChange} onBlur={handleBlur} />
  );
});

export default PriceInput;
