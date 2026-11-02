// Validação do lado do servidor (Zod 4). O cliente também valida,
// mas a API não confia no que chega do navegador.
import { z } from "zod";

const money = (label = "valor") =>
  z.coerce
    .number({ error: `Informe um ${label} válido.` })
    .positive(`O ${label} deve ser maior que zero.`)
    .max(100000, `O ${label} máximo é R$ 100.000,00.`);

export const shippingAddressSchema = z.object({
  postal_code: z.string().trim().regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido."),
  street: z.string().trim().min(3, "Informe a rua ou avenida."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().max(80, "Máximo de 80 caracteres.").optional().default(""),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().regex(/^[A-Za-z]{2}$/, "Informe a UF com duas letras."),
});

export const registerSchema = z.object({
  handle: z
    .string({ error: "Informe o handle." })
    .trim()
    .regex(/^@?[A-Za-z0-9_]{3,20}$/, "Use de 3 a 20 caracteres: letras, números ou _."),
  email: z.string({ error: "Informe o e-mail." }).trim().toLowerCase().email("E-mail inválido."),
  password: z.string({ error: "Informe a senha." }).min(6, "A senha deve ter pelo menos 6 caracteres."),
  shipping_address: shippingAddressSchema,
});

export const loginSchema = z.object({
  email: z.string({ error: "Informe o e-mail." }).trim().toLowerCase().min(1, "Informe o e-mail."),
  password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

export const updateMeSchema = z.object({
  avatar_url: z.string().max(2_000_000, "Imagem muito grande.").optional(),
  shipping_address: shippingAddressSchema.optional(),
});

export const productSchema = z.object({
  game_id: z.string().optional(),
  title: z.string().trim().min(1, "Informe o título.").max(120).optional(),
  platform: z.string().trim().max(40).optional(),
  price: money("preço"),
  has_box: z.boolean().optional().default(false),
  has_manual: z.boolean().optional().default(false),
  is_functional: z.boolean().optional().default(true),
  condition_tag: z.string().max(40).optional(),
  image_url: z.string().max(5_000_000).optional(),
});

// Na edição tudo é opcional e nada recebe valor padrão (o que não vier fica como está).
export const productUpdateSchema = z.object({
  game_id: z.string().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  platform: z.string().trim().max(40).optional(),
  price: money("preço").optional(),
  has_box: z.boolean().optional(),
  has_manual: z.boolean().optional(),
  is_functional: z.boolean().optional(),
  condition_tag: z.string().max(40).optional(),
  image_url: z.string().max(5_000_000).optional(),
});

export const offerCreateSchema = z.object({
  product_id: z.string({ error: "Informe o anúncio." }).min(1, "Informe o anúncio."),
  offered_price: money("valor da proposta"),
});

export const offerUpdateSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "COUNTER_OFFER"], { error: "Status inválido." }),
  offered_price: money("valor da proposta").optional(),
});

export const messageSchema = z.object({
  offer_id: z.string({ error: "Informe a negociação." }).min(1),
  text: z.string({ error: "Escreva a mensagem." }).trim().min(1, "Escreva a mensagem.").max(500),
});

export const reviewSchema = z.object({
  profile_id: z.string({ error: "Informe o perfil avaliado." }).min(1),
  rating: z.coerce.number().int().min(1, "Nota mínima: 1.").max(5, "Nota máxima: 5."),
  comment: z.string().trim().min(3, "O comentário deve ter pelo menos 3 caracteres.").max(300),
});

export const reviewUpdateSchema = z.object({
  rating: z.coerce.number().int().min(1, "Nota mínima: 1.").max(5, "Nota máxima: 5.").optional(),
  comment: z.string().trim().min(3, "O comentário deve ter pelo menos 3 caracteres.").max(300).optional(),
});

export const ticketSchema = z.object({
  category: z.string().min(1).max(40),
  priority: z.enum(["LOW", "HIGH", "CRITICAL"], { error: "Prioridade inválida." }),
  subject: z.string().trim().min(5, "O assunto deve ter pelo menos 5 caracteres.").max(80),
  description: z.string().trim().min(15, "O relatório detalhado deve ter pelo menos 15 caracteres.").max(3000),
});

export const ticketUpdateSchema = z.object({
  category: z.string().min(1).max(40).optional(),
  priority: z.enum(["LOW", "HIGH", "CRITICAL"], { error: "Prioridade inválida." }).optional(),
  subject: z.string().trim().min(5, "O assunto deve ter pelo menos 5 caracteres.").max(80).optional(),
  description: z.string().trim().min(15, "O relatório detalhado deve ter pelo menos 15 caracteres.").max(3000).optional(),
});

export const notificationUpdateSchema = z.object({ read: z.boolean() });

export const alertSchema = z.object({
  title: z.string({ error: "Informe o título do jogo." }).trim().min(2, "Informe o título do jogo.").max(120),
  platform: z.string().trim().max(40).nullable().optional(),
  target_price: money("preço alvo"),
});

export const alertUpdateSchema = z.object({
  target_price: money("preço alvo").optional(),
  platform: z.string().trim().max(40).nullable().optional(),
  active: z.boolean().optional(),
});

export const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(10).optional().default(1),
      }),
    )
    .min(1, "O carrinho está vazio."),
});

export const orderUpdateSchema = z.object({ status: z.literal("approved").optional() });

export const refundCreateSchema = z.object({
  order_id: z.string({ error: "Informe o pedido." }).min(1),
});

export const refundUpdateSchema = z.object({
  status: z.literal("paid", { error: "Só é possível marcar o reembolso como pago." }),
});
