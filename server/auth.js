// Aula 11 — JWT com Passport: cadastro (POST /usuarios), login (POST /login)
// e o middleware exigeJwt que protege as rotas com Authorization: Bearer <token>.
import { Router } from "express";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as store from "./store.js";
import { fail, parse, privateProfile, publicProfile, now } from "./http.js";
import { registerSchema, loginSchema, updateMeSchema } from "./schemas.js";

const SEGREDO = () => {
  if (!process.env.SEGREDO) throw new Error("Defina SEGREDO no arquivo .env");
  return process.env.SEGREDO;
};

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

// Login: 200 { token } ou 401.
router.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = store.find("profiles", (p) => String(p.email).toLowerCase() === email)[0];
  const ok = user ? await bcrypt.compare(password, String(user.password_hash || "")) : false;
  if (!ok) fail(401, "E-mail ou senha inválidos.");

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
