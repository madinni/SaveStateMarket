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

export const productSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "O título deve ter pelo menos 2 caracteres.")
    .max(80, "O título deve ter no máximo 80 caracteres."),
  platform: z.enum(PLATFORMS.map((p) => p.value), {
    errorMap: () => ({ message: "Selecione uma plataforma." }),
  }),
  price: z.coerce
    .number({ invalid_type_error: "Informe um preço válido." })
    .positive("O preço deve ser maior que zero.")
    .max(100000, "O preço máximo é R$ 100.000,00."),
  has_box: z.boolean(),
  has_manual: z.boolean(),
  is_functional: z.boolean(),
});
