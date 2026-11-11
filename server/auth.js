// Aula 11 — JWT com Passport: cadastro (POST /usuarios), login (POST /login)
// e o middleware exigeJwt que protege as rotas com Authorization: Bearer <token>.
import { Router } from "express";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as store from "./store.js";
import { fail, parse, privateProfile, publicProfile, now, HttpError } from "./http.js";
import { registerSchema, loginSchema, updateMeSchema, changePasswordSchema } from "./schemas.js";
import { criarLimitador, ipDe } from "./rateLimit.js";

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

// ---- Limites de tentativas (em memória, ver rateLimit.js)
// Login: conta só as tentativas que FALHARAM. Duas chaves:
// - IP + e-mail: 5 falhas em 15 min → 429 (um login bem-sucedido zera essa chave);
// - só IP (#26, contra password spraying): 20 falhas em 15 min → 429, mesmo trocando o
//   e-mail. O sucesso NÃO zera esta, para quem tem uma conta não "limpar" o próprio IP.
const LOGIN_JANELA_MS = 15 * 60 * 1000;
const loginPorEmail = criarLimitador({ max: 5, janelaMs: LOGIN_JANELA_MS });
const loginPorIp = criarLimitador({ max: 20, janelaMs: LOGIN_JANELA_MS });
// #25: troca de senha por usuário: 5 tentativas (com a senha atual conferida) em 15 min.
const trocaSenha = criarLimitador({ max: 5, janelaMs: 15 * 60 * 1000 });
// #27: cadastro por IP: 10 por hora.
const cadastroPorIp = criarLimitador({ max: 10, janelaMs: 60 * 60 * 1000 });

const chaveLogin = (req, email) => `${ipDe(req)}|${email}`;

// Usado pelos testes para não deixar o limitador vazar entre cenários.
export function resetLoginLimiter() {
  loginPorEmail.resetAll();
  loginPorIp.resetAll();
}

// ---- Tokens
// O iat vai com milissegundos (NumericDate fracionário é válido na RFC 7519) para comparar
// com password_changed_at sem a folga de 1 s: o token emitido logo após a troca vale, o
// emitido antes dela não (#24).
export function emitirToken(user) {
  return jwt.sign({ sub: user.id, iat: Date.now() / 1000 }, SEGREDO(), { expiresIn: "1h" });
}

// #24: token emitido antes da última troca de senha é recusado (401).
function tokenRevogado(payload, user) {
  if (!user.password_changed_at) return false;
  const trocadaEm = Date.parse(user.password_changed_at);
  if (!Number.isFinite(trocadaEm)) return false;
  return Math.round(Number(payload.iat) * 1000) < trocadaEm;
}

export function configurePassport() {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SEGREDO(),
      },
      async (payload, done) => {
        try {
          const user = await store.get("profiles", payload.sub);
          if (!user || tokenRevogado(payload, user)) return done(null, false);
          done(null, user);
        } catch (error) {
          done(error);
        }
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
// Limite por IP (#27): 10 cadastros por hora, contados antes do bcrypt e da gravação no banco.
router.post("/usuarios", async (req, res) => {
  const ip = ipDe(req);
  if (cadastroPorIp.bloqueado(ip)) fail(429, "Muitos cadastros a partir desta rede. Tente novamente mais tarde.");
  cadastroPorIp.hit(ip);
  const body = parse(registerSchema, req.body);
  const handle = body.handle.startsWith("@") ? body.handle : `@${body.handle}`;

  const profiles = await store.list("profiles");
  if (profiles.some((p) => String(p.email).toLowerCase() === body.email)) {
    fail(409, "Este e-mail já está cadastrado.", "email");
  }
  if (profiles.some((p) => String(p.handle).toLowerCase() === handle.toLowerCase())) {
    fail(409, "Este handle já está em uso.", "handle");
  }

  const password_hash = await bcrypt.hash(body.password, 10);
  // role nunca vem do cliente: perfis cadastrados aqui são sempre comuns.
  let created;
  try {
    created = await store.insert("profiles", {
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
  } catch (error) {
    if (error.code === "23505" && error.constraint === "savestate_profiles_email_uq") {
      fail(409, "Este e-mail já está cadastrado.", "email");
    }
    if (error.code === "23505" && error.constraint === "savestate_profiles_handle_uq") {
      fail(409, "Este handle já está em uso.", "handle");
    }
    throw error;
  }
  res.status(201).json(privateProfile(created));
});

// Login: 200 { token }, 401 ou 429 (muitas falhas seguidas).
router.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const chave = chaveLogin(req, email);
  const ip = ipDe(req);
  if (loginPorEmail.bloqueado(chave) || loginPorIp.bloqueado(ip)) {
    fail(429, "Muitas tentativas de login. Tente novamente em alguns minutos.");
  }

  // A tentativa conta ANTES do await do bcrypt: assim requisições em paralelo não passam
  // todas pela checagem acima com o contador ainda zerado (#17). O sucesso zera só a chave
  // IP + e-mail (a do IP sozinho continua contando as falhas, #26).
  loginPorEmail.hit(chave);
  loginPorIp.hit(ip);

  const user = (await store.find("profiles", (p) => String(p.email).toLowerCase() === email))[0];
  const ok = user ? await bcrypt.compare(password, String(user.password_hash || "")) : false;
  if (!ok) fail(401, "E-mail ou senha inválidos.");
  loginPorEmail.reset(chave);
  // O sucesso não conta como falha do IP: desfaz a tentativa registrada acima.
  loginPorIp.desfazer(ip);

  res.json({ token: emitirToken(user) });
});

router.get("/usuarios/me", exigeJwt, (req, res) => {
  res.json(privateProfile(req.user));
});

// O usuário altera só avatar e endereço. account_status, reputação, saldo etc.
// são decididos pelo servidor e são ignorados se vierem no corpo.
async function updateMe(req, res) {
  const body = parse(updateMeSchema, req.body);
  const updated = await store.update("profiles", req.user.id, body);
  res.json(privateProfile(updated));
}
router.patch("/usuarios/me", exigeJwt, updateMe);

// Troca de senha (vale para o admin também). Exige a senha atual; grava um novo hash bcrypt.
// #25: até 5 tentativas por usuário em 15 min (contadas antes do bcrypt; o sucesso zera).
// #24: grava password_changed_at, o que derruba todos os tokens anteriores, e devolve um
// token novo para a sessão atual continuar: 200 { message, token }.
router.patch("/usuarios/me/senha", exigeJwt, async (req, res) => {
  const { current_password, new_password } = parse(changePasswordSchema, req.body);
  const chave = String(req.user.id);
  if (trocaSenha.bloqueado(chave)) {
    fail(429, "Muitas tentativas de troca de senha. Tente novamente em alguns minutos.");
  }
  trocaSenha.hit(chave);
  const ok = await bcrypt.compare(current_password, String(req.user.password_hash || ""));
  if (!ok) fail(400, "Senha atual incorreta.", "current_password");
  const password_hash = await bcrypt.hash(new_password, 10);
  const user = await store.update("profiles", req.user.id, { password_hash, password_changed_at: now() });
  trocaSenha.reset(chave);
  res.json({ message: "Senha alterada com sucesso.", token: emitirToken(user) });
});

// Perfis públicos (sem e-mail, hash, endereço e status da conta).
const listPublic = async (_req, res) => res.json((await store.list("profiles")).map(publicProfile));
const getPublic = async (req, res) => {
  const profile = await store.get("profiles", req.params.id);
  if (!profile) fail(404, "Operador não encontrado.");
  res.json(publicProfile(profile));
};
router.get("/usuarios", listPublic);
router.get("/profiles", listPublic);
router.get("/profiles/:id", getPublic);

// Compatibilidade com o front antigo: PATCH /profiles/:id só vale para o próprio perfil.
router.patch("/profiles/:id", exigeJwt, async (req, res) => {
  if (!await store.get("profiles", req.params.id)) fail(404, "Operador não encontrado.");
  if (String(req.params.id) !== String(req.user.id)) fail(403, "Você só pode alterar o próprio perfil.");
  await updateMe(req, res);
});

export default router;
