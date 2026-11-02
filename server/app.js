import express from "express";
import cors from "cors";
import passport from "passport";
import authRoutes, { configurePassport } from "./auth.js";
import resourceRoutes from "./resources.js";
import { HttpError } from "./http.js";

export function createApp() {
  configurePassport();
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "10mb" })); // imagens chegam em base64
  app.use((req, _res, next) => {
    req.body ??= {}; // Express 5 deixa req.body undefined quando não há corpo
    next();
  });
  app.use(passport.initialize());

  app.get("/", (_req, res) => res.json({ api: "SaveState Market", status: "online" }));
  app.use(authRoutes);
  app.use(resourceRoutes);

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
      return res.status(413).json({ message: "Arquivo muito grande." });
    }
    console.error(err);
    res.status(500).json({ message: "Erro interno do servidor." });
  });

  return app;
}
