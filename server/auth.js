// Aula 11 — JWT com Passport: cadastro (POST /usuarios), login (POST /login)
// e o middleware exigeJwt que protege as rotas com Authorization: Bearer <token>.
import { Router } from "express";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as store from "./store.js";
import { fail, parse, privateProfile, publicProfile, now, HttpError } from "./http.js";
import { registerSchema, loginSchema, updateMeSchema } from "./schemas.js";

const SEGREDO_PLACEHOLDER = "troque-por-um-segredo";
const SEGREDO_MIN = 32;
const COMO_GERAR =
  `Gere um com: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" ` +
  "e coloque em SEGREDO=... no arquivo .env.";

// Recusa segredo ausente, igual ao placeholder do modelo `env` ou curto demais.
// Devolve a mensagem de erro (ou null se o segredo for aceitável).
export function problemaDoSegredo(segredo = process.env.SEGREDO) {
  if (!segredo) return `SEGREDO não definido. ${COMO_GERAR}`;
  if (segredo.trim() === SEGREDO_PLACEHOLDER) {
    return `SEGREDO ainda está com o valor de exemplo "${SEGREDO_PLACEHOLDER}". ${COMO_GERAR}`;
  }
  if (segredo.length < SEGREDO_MIN) {
    return `SEGREDO fraco: use pelo menos ${SEGREDO_MIN} caracteres (atual: ${segredo.length}). ${COMO_GERAR}`;
  }
  return null;
}

const SEGREDO = () => {
  const problema = problemaDoSegredo();
  if (problema) throw new Error(problema);
  return process.env.SEGREDO;
};

// ---- Limite de tentativas de login (em memória)
// Conta só as tentativas que FALHARAM por IP + e-mail. Após 5 falhas dentro de 15 minutos,
// responde 429 até a janela expirar. Um login bem-sucedido zera o contador.
const LOGIN_MAX_FALHAS = 5;
const LOGIN_JANELA_MS = 15 * 60 * 1000;
const falhasLogin = new Map(); // chave → { count, inicio }

const chaveLogin = (req, email) => `${req.ip || req.socket?.remoteAddress || "?"}|${email}`;

function registroAtivo(chave, agora = Date.now()) {
  const registro = falhasLogin.get(chave);
  if (!registro) return null;
  if (agora - registro.inicio >= LOGIN_JANELA_MS) {
    falhasLogin.delete(chave);
    return null;
  }
  return registro;
}

function registrarFalha(chave) {
  const agora = Date.now();
  const registro = registroAtivo(chave, agora);
  if (registro) registro.count += 1;
  else falhasLogin.set(chave, { count: 1, inicio: agora });
  // Faxina simples para o Map não crescer sem limite.
  if (falhasLogin.size > 10000) {
    for (const [k, r] of falhasLogin) if (agora - r.inicio >= LOGIN_JANELA_MS) falhasLogin.delete(k);
  }
}

// Usado pelos testes para não deixar o limitador vazar entre cenários.
export function resetLoginLimiter() {
  falhasLogin.clear();
}

export function configurePassport() {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SEGREDO(),
      },
      (payload, done) => {
        const user = store.get("profiles", payload.sub);
        done(null, user || false);
      },
    ),
  );
}

// Sem token, token vencido ou adulterado → 401 (em JSON).
export function exigeJwt(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Sessão inválida ou expirada. Entre novamente." });
    }
    req.user = user;
    next();
  })(req, res, next);
}

// Para rotas públicas que se comportam diferente quando há alguém logado.
export function jwtOpcional(req, res, next) {
  if (!req.headers.authorization) return next();
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (user) req.user = user;
    next();
  })(req, res, next);
}

// Rotas do administrador: sem token → 401 (igual ao exigeJwt); usuário comum → 403.
export function exigeAdmin(req, res, next) {
  exigeJwt(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== "admin") return next(new HttpError(403, "Acesso restrito ao administrador."));
    next();
  });
}

export const isBlocked = (user) => user?.account_status === "refund_pending";

const router = Router();

// Cadastro: 201 sem a senha; 409 para e-mail ou handle repetido.
router.post("/usuarios", async (req, res) => {
  const body = parse(registerSchema, req.body);
  const handle = body.handle.startsWith("@") ? body.handle : `@${body.handle}`;

  const profiles = store.list("profiles");
  if (profiles.some((p) => String(p.email).toLowerCase() === body.email)) {
    fail(409, "Este e-mail já está cadastrado.", "email");
  }
  if (profiles.some((p) => String(p.handle).toLowerCase() === handle.toLowerCase())) {
    fail(409, "Este handle já está em uso.", "handle");
  }

  const password_hash = await bcrypt.hash(body.password, 10);
  // role nunca vem do cliente: perfis cadastrados aqui são sempre comuns.
  const created = store.insert("profiles", {
    id: crypto.randomUUID(),
    handle,
    email: body.email,
    password_hash,
    shipping_address: body.shipping_address,
    account_status: "active",
    reputation: 5,
    total_transactions: 0,
    success_rate: 100,
    vault_balance: 0,
    clearance_level: "LEVEL_3",
    created_at: now(),
  });
  res.status(201).json(privateProfile(created));
});

// Login: 200 { token }, 401 ou 429 (muitas falhas seguidas).
router.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const chave = chaveLogin(req, email);
  const registro = registroAtivo(chave);
  if (registro && registro.count >= LOGIN_MAX_FALHAS) {
    fail(429, "Muitas tentativas de login. Tente novamente em alguns minutos.");
  }

  // A tentativa conta ANTES do await do bcrypt: assim requisições em paralelo não passam
  // todas pela checagem acima com o contador ainda zerado (#17). O sucesso zera a chave.
  registrarFalha(chave);

  const user = store.find("profiles", (p) => String(p.email).toLowerCase() === email)[0];
  const ok = user ? await bcrypt.compare(password, String(user.password_hash || "")) : false;
  if (!ok) fail(401, "E-mail ou senha inválidos.");
  falhasLogin.delete(chave);

  const token = jwt.sign({ sub: user.id }, SEGREDO(), { expiresIn: "1h" });
  res.json({ token });
});

router.get("/usuarios/me", exigeJwt, (req, res) => {
  res.json(privateProfile(req.user));
});

// O usuário altera só avatar e endereço. account_status, reputação, saldo etc.
// são decididos pelo servidor e são ignorados se vierem no corpo.
function updateMe(req, res) {
  const body = parse(updateMeSchema, req.body);
  const updated = store.update("profiles", req.user.id, body);
  res.json(privateProfile(updated));
}
router.patch("/usuarios/me", exigeJwt, updateMe);

// Perfis públicos (sem e-mail, hash, endereço e status da conta).
const listPublic = (req, res) => res.json(store.list("profiles").map(publicProfile));
const getPublic = (req, res) => {
  const profile = store.get("profiles", req.params.id);
  if (!profile) fail(404, "Operador não encontrado.");
  res.json(publicProfile(profile));
};
router.get("/usuarios", listPublic);
router.get("/profiles", listPublic);
router.get("/profiles/:id", getPublic);

// Compatibilidade com o front antigo: PATCH /profiles/:id só vale para o próprio perfil.
router.patch("/profiles/:id", exigeJwt, (req, res) => {
  if (!store.get("profiles", req.params.id)) fail(404, "Operador não encontrado.");
  if (String(req.params.id) !== String(req.user.id)) fail(403, "Você só pode alterar o próprio perfil.");
  updateMe(req, res);
});

export default router;
