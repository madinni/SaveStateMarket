// Helpers puros para valores em R$ digitados no padrão pt-BR.
//
// Regra adotada:
// - A vírgula é o separador decimal (no máximo 2 casas). Os pontos antes dela são milhar.
// - Sem vírgula, o ponto é milhar. A única exceção é o ÚLTIMO ponto seguido de 1 ou 2
//   dígitos no fim do texto ("12.5", "12.50", "1.234.56"): aí ele é decimal, para quem
//   digita no padrão americano ou cola um valor. "1.500" → 1500; "12.50" → 12.5.
// - Valor colado no padrão americano com vírgula de milhar ("1,234.56") é reconhecido e
//   convertido para "1.234,56".
// - Nenhum dígito da parte inteira é descartado. Só a 3ª casa decimal em diante, depois
//   da vírgula, é cortada (isso não muda a ordem de grandeza do valor).

// "1,234.56" ou "12,345,678.9": vírgula de milhar e ponto decimal (padrão americano).
const US_FORMAT = /^\d{1,3}(,\d{3})+\.\d*$/;

const onlyPriceChars = (raw) => String(raw ?? "").replace(/[^\d.,]/g, "");

// Texto digitado → texto limpo para o campo (dígitos, pontos e no máximo uma vírgula).
export const sanitizePrice = (raw) => {
  let text = onlyPriceChars(raw).replace(/\.{2,}/g, ".");
  if (US_FORMAT.test(text)) {
    const [intPart, decPart] = text.split(".");
    text = `${intPart.replace(/,/g, ".")},${decPart}`;
  }
  const comma = text.indexOf(",");
  if (comma === -1) return text;
  const before = text.slice(0, comma);
  const after = text.slice(comma + 1).replace(/\D/g, "").slice(0, 2);
  return `${before},${after}`;
};

// Texto do campo (ou número) → número. Vazio ou inválido → null.
export const parsePrice = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = sanitizePrice(String(value ?? "").trim());
  if (!/\d/.test(text)) return null;

  let intPart = text;
  let decPart = "";
  const comma = text.indexOf(",");
  if (comma !== -1) {
    intPart = text.slice(0, comma);
    decPart = text.slice(comma + 1);
  } else {
    const decimalDot = text.match(/\.(\d{1,2})$/);
    if (decimalDot) {
      intPart = text.slice(0, decimalDot.index);
      decPart = decimalDot[1];
    }
  }
  intPart = intPart.replace(/\./g, "") || "0";
  const number = Number(decPart ? `${intPart}.${decPart}` : intPart);
  return Number.isFinite(number) ? number : null;
};

// Número → texto pt-BR para mostrar no campo ("1500" → "1.500", 12.5 → "12,50").
export const formatPriceText = (value) => {
  const number = parsePrice(value);
  if (number === null) return sanitizePrice(value);
  const cents = Math.round(number * 100);
  const intText = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimals = cents % 100;
  return decimals ? `${intText},${String(decimals).padStart(2, "0")}` : intText;
};
