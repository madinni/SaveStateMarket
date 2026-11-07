import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import authRoutes, { configurePassport } from "./auth.js";
import resourceRoutes from "./resources.js";
import adminRoutes from "./admin.js";
import { HttpError } from "./http.js";
import catalogRoutes from "./catalog.js";

// #27: limite de corpo. Só as rotas que recebem imagem em data URL (avatar, foto do anúncio,
// capa do jogo) aceitam 2 MB; o resto, 100 KB. Acima disso → 413 em JSON.
export const LIMITE_CORPO = "100kb";
export const LIMITE_CORPO_IMAGEM = "2mb";
// #35: casamento exato (não por prefixo), para que /usuarios/me/senha e outras rotas
// irmãs fiquem no limite de 100 KB.
const ROTAS_COM_IMAGEM = [
  /^\/products\/?$/,
  /^\/products\/[^/]+\/?$/,
  /^\/usuarios\/me\/?$/,
  /^\/profiles\/[^/]+\/?$/,
  /^\/games\/?$/,
  /^\/games\/[^/]+\/?$/,
];
export const aceitaImagem = (path) => ROTAS_COM_IMAGEM.some((re) => re.test(path));

export function createApp() {
  configurePassport();
  const app = express();

  // #29: sem "X-Powered-By: Express" e com os cabeçalhos do helmet. A API só devolve JSON,
  // então a CSP dela não libera nada (nem ser embutida em frames).
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { "default-src": ["'none'"], "frame-ancestors": ["'none'"] },
      },
    }),
  );
  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  // O primeiro parser que ler o corpo vence; o segundo pula requisições já lidas.
  const jsonImagem = express.json({ limit: LIMITE_CORPO_IMAGEM });
  app.use((req, res, next) => (aceitaImagem(req.path) ? jsonImagem(req, res, next) : next()));
  app.use(express.json({ limit: LIMITE_CORPO }));
  app.use((req, _res, next) => {
    req.body ??= {}; // Express 5 deixa req.body undefined quando não há corpo
    next();
  });
  app.use(passport.initialize());

  app.get("/", (_req, res) => res.json({ api: "SaveState Market", status: "online" }));
  app.use(authRoutes);
  app.use(catalogRoutes);
  app.use(resourceRoutes);
  app.use(adminRoutes);

  app.use((_req, res) => res.status(404).json({ message: "Rota não encontrada." }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message, field: err.field });
    }
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ message: "JSON inválido no corpo da requisição." });
    }
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ message: "Corpo da requisição muito grande. Envie uma imagem menor." });
    }
    console.error(err);
    res.status(500).json({ message: "Erro interno do servidor." });
  });

  return app;
}
