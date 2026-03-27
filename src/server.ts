import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import {
  eventsRouter,
  galleryRouter,
  membersRouter,
  routesRouter,
  sponsorsRouter,
} from "./routes/resources.js";
import { ok } from "./utils/http.js";

const app = express();

const allowedOrigins = env.corsOrigin
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const transparentGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

/**
 * Mantém compatibilidade com registros antigos que ainda apontam para /uploads/...
 * Em vez de responder 404 e gerar erro visual no navegador, devolve uma imagem mínima.
 */
app.get("/uploads/*", (_req, res) => {
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(transparentGif);
});

app.get("/api/health", (_req, res) => ok(res, { status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/routes", routesRouter);
app.use("/api/members", membersRouter);
app.use("/api/sponsors", sponsorsRouter);
app.use("/api/events", eventsRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada.",
  });
});

app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Erro capturado:", error);

    if (res.headersSent) {
      return;
    }

    const status = error?.status || error?.statusCode || 500;

    res.status(status).json({
      success: false,
      message:
        status === 404
          ? "Recurso não encontrado."
          : "Erro interno do servidor.",
    });
  },
);

const port = Number(process.env.PORT || env.port || 3001);

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend rodando em http://0.0.0.0:${port}`);
  console.log(`🌐 Origens permitidas CORS: ${allowedOrigins.join(", ")}`);
  console.log("🗂️ Uploads persistidos no banco via data URL");
});