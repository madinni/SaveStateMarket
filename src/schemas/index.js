import { z } from "zod";
import { parsePrice } from "../utils/price";

export const PLATFORMS = [
  { value: "SNES (CART)", label: "Super Nintendo (SNES)" },
  { value: "N64 (CART)", label: "Nintendo 64" },
  { value: "PS1 (DISC)", label: "PlayStation 1" },
  { value: "PS2 (DISC)", label: "PlayStation 2" },
  { value: "XBOX 360", label: "Xbox 360" },
  { value: "SWITCH (CART)", label: "Nintendo Switch" },
];

// Aceita um e-mail válido ou o literal "admin" (conta inicial do administrador).
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .refine((value) => value === "admin" || z.email().safeParse(value).success, "E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export const shippingAddressSchema = z.object({
  postal_code: z.string().trim().regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido."),
  street: z.string().trim().min(3, "Informe a rua ou avenida."),
  street_verified: z.boolean().refine(Boolean, "Selecione uma rua confirmada pela busca externa."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().max(80, "Máximo de 80 caracteres."),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().regex(/^[A-Za-z]{2}$/, "Informe a UF com duas letras."),
}).transform(({ street_verified, ...address }) => address);

export const shippingAddressFormSchema = z.object({
  shipping_address: shippingAddressSchema,
});

// O bcrypt do servidor só usa os primeiros 72 bytes da senha (acentos ocupam 2 bytes).
const byteLength = (value) => new TextEncoder().encode(value).length;

export const registerSchema = z.object({
  handle: z
    .string()
    .trim()
    .regex(
      /^@?[A-Za-z0-9_]{3,20}$/,
      "Use de 3 a 20 caracteres: letras, números ou _.",
    ),
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .refine((v) => byteLength(v) <= 72, "A senha deve ter no máximo 72 bytes (72 caracteres sem acento)."),
  shipping_address: shippingAddressSchema,
});

// Campos de preço no padrão pt-BR: "1.500" → 1500, "1.500,50" → 1500.5, "12,50" → 12.5
// ("12.50" também vira 12.5). A regra fica em utils/price.js. Sem isso o z.coerce.number()
// transformaria "12,50" em NaN e "1.500" em 1.5. Texto vazio ou inválido segue como texto
// e cai nas mensagens de erro do schema.
const decimalText = (value) => {
  if (typeof value !== "string") return value;
  const number = parsePrice(value);
  return number === null ? value.trim() : number;
};

// Zod 4: a mensagem de tipo inválido vai em { error } (invalid_type_error foi removido).
const money = (message = "Informe um valor válido.") =>
  z.preprocess(
    decimalText,
    z.coerce
      .number({ error: message })
      .positive("O valor deve ser maior que zero.")
      .max(100000, "O valor máximo é R$ 100.000,00."),
  );

// Título e plataforma vêm do catálogo (Jogo Base) a partir do game_id.
export const productSchema = z.object({
  game_id: z.string().min(1, "Selecione um jogo do catálogo."),
  price: z.preprocess(
    decimalText,
    z.coerce
      .number({ error: "Informe um preço válido." })
      .positive("O preço deve ser maior que zero.")
      .max(100000, "O preço máximo é R$ 100.000,00."),
  ),
  has_box: z.boolean(),
  has_manual: z.boolean(),
  is_functional: z.boolean(),
});

export const reviewSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(3, "O comentário deve ter pelo menos 3 caracteres.")
    .max(300, "O comentário deve ter no máximo 300 caracteres."),
  rating: z.coerce.number().int().min(1).max(5),
});

export const TICKET_CATEGORIES = [
  { value: "MEDIA_DEFECT", label: "Mídia com Defeito / Leitura Falhou" },
  { value: "ESCROW_LOCK", label: "Retenção de Saldo / Custódia Presa" },
  { value: "PRICE_DISCREPANCY", label: "Divergência de Valor no Anúncio" },
  { value: "FRAUD_REPORT", label: "Suspeita de Fraude / Conduta Imprópria" },
  { value: "SYSTEM_BUG", label: "Anomalia na Interface / Bug Técnico" },
];

export const ticketSchema = z.object({
  category: z.enum(TICKET_CATEGORIES.map((c) => c.value)),
  priority: z.enum(["LOW", "HIGH", "CRITICAL"]),
  subject: z.string().trim().min(5, "O assunto deve ter pelo menos 5 caracteres.").max(80),
  description: z
    .string()
    .trim()
    .min(15, "A descrição deve ter pelo menos 15 caracteres."),
});

// Visitante (sem login) precisa deixar um e-mail para receber a resposta do ticket.
export const guestTicketSchema = ticketSchema.extend({
  contact_email: z
    .string()
    .trim()
    .min(1, "Informe um e-mail para contato.")
    .email("Informe um e-mail de contato válido.")
    .max(120, "Máximo de 120 caracteres."),
});

export const priceSchema = z.object({
  price: money(),
});

export const offerSchema = priceSchema.extend({
  message: z.string().trim().max(200, "Máximo de 200 caracteres.").optional(),
});

export const chatSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

// ---- Alertas de preço por título (UC11) ----
// Ex.: "GTA VI" até R$ 200. A plataforma é opcional ("" = qualquer plataforma).
export const alertSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do jogo.").max(120, "Máximo de 120 caracteres."),
  platform: z.string().optional(),
  target_price: money("Informe o preço alvo."),
});

// Só o alvo (editar um alerta existente ou criar a partir da página do anúncio).
export const alertTargetSchema = z.object({
  target_price: money("Informe o preço alvo."),
});

// ---- Denúncia de anúncio (UC15) ----
export const REPORT_REASONS = [
  { value: "FALSIFICADO", label: "Mídia falsificada / réplica" },
  { value: "GOLPE", label: "Suspeita de golpe" },
  { value: "DESCRICAO_ENGANOSA", label: "Descrição enganosa" },
  { value: "CONTEUDO_IMPROPRIO", label: "Conteúdo impróprio" },
  { value: "OUTRO", label: "Outro motivo" },
];

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS.map((r) => r.value), { error: "Selecione um motivo." }),
  details: z.string().trim().max(500, "Máximo de 500 caracteres."),
});

// ---- Painel do administrador (tickets) ----
export const TICKET_STATUSES = [
  { value: "OPEN", label: "ABERTO" },
  { value: "IN_PROGRESS", label: "EM ANÁLISE" },
  { value: "CLOSED", label: "FECHADO" },
];

export const adminTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES.map((s) => s.value)),
  admin_reply: z.string().trim().max(3000, "Máximo de 3000 caracteres."),
});

// ---- Troca de senha (PATCH /usuarios/me/senha) ----
// 72 é o limite do bcrypt. A confirmação e a regra "diferente da atual" são só do formulário.
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual."),
    new_password: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
      .refine((v) => byteLength(v) <= 72, "A nova senha deve ter no máximo 72 bytes (72 caracteres sem acento)."),
    confirm_password: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "As senhas não conferem.",
  })
  .refine((v) => !v.current_password || v.new_password !== v.current_password, {
    path: ["new_password"],
    message: "A nova senha deve ser diferente da atual.",
  });

// ---- Consulta de ticket por visitante (POST /tickets/consulta) ----
export const ticketLookupSchema = z.object({
  id: z.string().trim().min(1, "Informe o número do ticket."),
  codigo: z.string().trim().min(1, "Informe o código de acesso."),
});
