import express from "express";
import cors from "cors";
import path from "path";
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
import { ensureUploadsDir, uploadsDir } from "./services/files.js";

const app = express();

await ensureUploadsDir();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(uploadsDir, {
    index: false,
    immutable: false,
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");

      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".jpg" || ext === ".jpeg") {
        res.type("image/jpeg");
      } else if (ext === ".png") {
        res.type("image/png");
      } else if (ext === ".webp") {
        res.type("image/webp");
      } else if (ext === ".gif") {
        res.type("image/gif");
      } else if (ext === ".svg") {
        res.type("image/svg+xml");
      }
    },
  }),
);

/**
 * Se uma imagem não existir, responde 404 sem JSON.
 * Isso evita transformar requisição de imagem em resposta JSON,
 * o que costuma gerar ERR_BLOCKED_BY_ORB no navegador.
 */
app.use("/uploads", (_req, res) => {
  res.status(404).end();
});

app.get("/api/health", (_req, res) => ok(res, { status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/routes", routesRouter);
app.use("/api/members", membersRouter);
app.use("/api/sponsors", sponsorsRouter);
app.use("/api/events", eventsRouter);

/**
 * 404 apenas para rotas da API
 */
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada.",
  });
});

/**
 * Middleware global de erro
 */
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Erro capturado:", error);

    if (res.headersSent) {
      return;
    }

    const status =
      error?.status ||
      error?.statusCode ||
      (error?.code === "ENOENT" ? 404 : 500);

    /**
     * Para rota de imagem/upload, evita responder JSON.
     */
    if (req.path.startsWith("/uploads")) {
      res.status(status === 500 ? 404 : status).end();
      return;
    }

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
  console.log(`🖼️ Uploads em: ${uploadsDir}`);
  console.log(`🌐 Origens permitidas CORS: ${allowedOrigins.join(", ")}`);
});