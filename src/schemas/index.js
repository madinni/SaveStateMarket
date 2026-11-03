import { z } from "zod";

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

export const registerSchema = z.object({
  handle: z
    .string()
    .trim()
    .regex(
      /^@?[A-Za-z0-9_]{3,20}$/,
      "Use de 3 a 20 caracteres: letras, números ou _.",
    ),
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  shipping_address: shippingAddressSchema,
});

// Zod 4: a mensagem de tipo inválido vai em { error } (invalid_type_error foi removido).
const money = (message = "Informe um valor válido.") =>
  z.coerce.number({ error: message }).positive("O valor deve ser maior que zero.");

// Título e plataforma vêm do catálogo (Jogo Base) a partir do game_id.
export const productSchema = z.object({
  game_id: z.string().min(1, "Selecione um jogo do catálogo."),
  price: z.coerce
    .number({ error: "Informe um preço válido." })
    .positive("O preço deve ser maior que zero.")
    .max(100000, "O preço máximo é R$ 100.000,00."),
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
    .min(15, "O relatório detalhado deve ter pelo menos 15 caracteres."),
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
  price: z.coerce
    .number({ error: "Informe um valor válido." })
    .positive("O valor deve ser maior que zero.")
    .max(100000, "O valor máximo é R$ 100.000,00."),
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
