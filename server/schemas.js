// Validação do lado do servidor (Zod 4). O cliente também valida,
// mas a API não confia no que chega do navegador.
import { z } from "zod";

const money = (label = "valor") =>
  z.coerce
    .number({ error: `Informe um ${label} válido.` })
    .positive(`O ${label} deve ser maior que zero.`)
    .max(100000, `O ${label} máximo é R$ 100.000,00.`);

// #28: imagens (avatar_url, image_url, cover_url) só como URL http(s) ou data URL de imagem
// raster em base64 (é o que o front gera no upload: canvas.toDataURL("image/jpeg")).
// Recusa javascript:, vbscript:, data:text/html, data:image/svg+xml etc.
export const IMAGEM_MAX = 1_500_000; // caracteres da data URL (~1,1 MB de imagem)
const URL_HTTP = /^https?:\/\/[^\s]+$/i;
const DATA_IMAGEM = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i;

export const urlSegura = (label = "A imagem") =>
  z
    .string({ error: `${label} deve ser um texto.` })
    .trim()
    .max(IMAGEM_MAX, `${label} é muito grande (máximo de 1,5 MB).`)
    .refine(
      (v) => v === "" || URL_HTTP.test(v) || DATA_IMAGEM.test(v),
      `${label} deve ser uma URL http(s) ou uma imagem PNG, JPEG, WEBP ou GIF.`,
    );

// #32: o bcrypt só usa os primeiros 72 bytes; acima disso a senha seria cortada sem aviso.
const bytes = (s) => new TextEncoder().encode(s).length;
const senhaNova = (label, required) =>
  z
    .string({ error: required })
    .min(8, `${label} deve ter pelo menos 8 caracteres.`)
    .refine((v) => bytes(v) <= 72, `${label} deve ter no máximo 72 bytes (72 caracteres sem acento).`);

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
  password: senhaNova("A senha", "Informe a senha."),
  shipping_address: shippingAddressSchema,
});

export const loginSchema = z.object({
  email: z.string({ error: "Informe o e-mail." }).trim().toLowerCase().min(1, "Informe o e-mail."),
  password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

export const updateMeSchema = z.object({
  avatar_url: urlSegura("A foto de perfil").optional(),
  shipping_address: shippingAddressSchema.optional(),
});

// Troca de senha (PATCH /usuarios/me/senha). O bcrypt só usa os primeiros 72 bytes.
export const changePasswordSchema = z
  .object({
    current_password: z.string({ error: "Informe a senha atual." }).min(1, "Informe a senha atual."),
    new_password: senhaNova("A nova senha", "Informe a nova senha."),
  })
  .refine((d) => d.new_password !== d.current_password, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["new_password"],
  });

// #30: o anúncio sempre aponta para um jogo do catálogo; título e plataforma vêm do jogo
// (campos title/platform enviados pelo cliente são descartados pelo Zod).
export const productSchema = z.object({
  game_id: z.string({ error: "Selecione um jogo do catálogo." }).trim().min(1, "Selecione um jogo do catálogo."),
  price: money("preço"),
  has_box: z.boolean().optional().default(false),
  has_manual: z.boolean().optional().default(false),
  is_functional: z.boolean().optional().default(true),
  condition_tag: z.string().max(40).optional(),
  image_url: urlSegura("A foto do anúncio").optional(),
});

// Na edição tudo é opcional e nada recebe valor padrão (o que não vier fica como está).
// Sem game_id, o jogo (título/plataforma) atual é mantido.
export const productUpdateSchema = z.object({
  game_id: z.string().trim().min(1, "Selecione um jogo do catálogo.").optional(),
  price: money("preço").optional(),
  has_box: z.boolean().optional(),
  has_manual: z.boolean().optional(),
  is_functional: z.boolean().optional(),
  condition_tag: z.string().max(40).optional(),
  image_url: urlSegura("A foto do anúncio").optional(),
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
  // Obrigatório para visitantes (checado na rota); opcional para quem está logado.
  contact_email: z
    .string({ error: "Informe um e-mail de contato válido." })
    .trim()
    .toLowerCase()
    .email("Informe um e-mail de contato válido.")
    .max(120)
    .optional(),
});

// Consulta pública de ticket de visitante (POST /tickets/consulta).
export const ticketConsultaSchema = z.object({
  id: z.string({ error: "Informe o número do ticket." }).trim().toUpperCase().min(1, "Informe o número do ticket.").max(60),
  codigo: z.string({ error: "Informe o código de consulta." }).trim().toUpperCase().min(1, "Informe o código de consulta.").max(32),
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

// ---- Denúncias de anúncio (usuário logado)
export const REPORT_REASONS = ["FALSIFICADO", "GOLPE", "DESCRICAO_ENGANOSA", "CONTEUDO_IMPROPRIO", "OUTRO"];

export const reportCreateSchema = z.object({
  product_id: z.string({ error: "Informe o anúncio." }).trim().min(1, "Informe o anúncio."),
  reason: z.enum(REPORT_REASONS, { error: "Motivo da denúncia inválido." }),
  details: z.string().trim().max(500, "Os detalhes devem ter no máximo 500 caracteres.").optional(),
});

// ---- Administrador
export const adminTicketUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"], { error: "Status do ticket inválido." }).optional(),
  admin_reply: z
    .string({ error: "A resposta deve ser um texto." })
    .trim()
    .min(1, "Escreva a resposta.")
    .max(3000, "A resposta deve ter no máximo 3000 caracteres.")
    .optional(),
});

export const adminReportUpdateSchema = z.object({
  status: z.literal("DISMISSED", { error: "Só é possível arquivar a denúncia (DISMISSED)." }),
});
