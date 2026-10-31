import { z } from "zod";

export const PLATFORMS = [
  { value: "SNES (CART)", label: "Super Nintendo (SNES)" },
  { value: "N64 (CART)", label: "Nintendo 64" },
  { value: "PS1 (DISC)", label: "PlayStation 1" },
  { value: "PS2 (DISC)", label: "PlayStation 2" },
  { value: "XBOX 360", label: "Xbox 360" },
  { value: "SWITCH (CART)", label: "Nintendo Switch" },
];

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
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
});

// Título e plataforma vêm do catálogo (Jogo Base) a partir do game_id.
export const productSchema = z.object({
  game_id: z.string().min(1, "Selecione um jogo do catálogo."),
  price: z.coerce
    .number({ invalid_type_error: "Informe um preço válido." })
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

export const priceSchema = z.object({
  price: z.coerce
    .number({ invalid_type_error: "Informe um valor válido." })
    .positive("O valor deve ser maior que zero.")
    .max(100000, "O valor máximo é R$ 100.000,00."),
});

export const offerSchema = priceSchema.extend({
  message: z.string().trim().max(200, "Máximo de 200 caracteres.").optional(),
});

export const chatSchema = z.object({
  text: z.string().trim().min(1).max(500),
});