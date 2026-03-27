// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { env } from './config/env.js';
// import authRouter from './routes/auth.js';
// import { eventsRouter, galleryRouter, membersRouter, routesRouter, sponsorsRouter } from './routes/resources.js';
// import { ok } from './utils/http.js';
// import { ensureUploadsDir, uploadsDir } from './services/files.js';

// const app = express();
// await ensureUploadsDir();

// app.use(
//   cors({
//     origin: env.corsOrigin.split(',').map((item) => item.trim()),
//     credentials: true
//   })
// );
// app.use(express.json());
// app.use('/uploads', express.static(uploadsDir, {
//   fallthrough: false,
//   index: false,
//   immutable: false,
//   maxAge: '1h',
//   setHeaders: (res) => {
//     res.setHeader('X-Content-Type-Options', 'nosniff');
//   }
// }));

// app.get('/api/health', (_req, res) => ok(res, { status: 'ok' }));
// app.use('/api/auth', authRouter);
// app.use('/api/gallery', galleryRouter);
// app.use('/api/routes', routesRouter);
// app.use('/api/members', membersRouter);
// app.use('/api/sponsors', sponsorsRouter);
// app.use('/api/events', eventsRouter);

// app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
//   console.error(error);
//   res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
// });

// app.use((_, res) => {
//   res.status(404).json({ success: false, message: 'Rota não encontrada.' });
// });

// app.listen(env.port, () => {
//   console.log(`🚀 Backend rodando em http://localhost:${env.port}`);
//   console.log(`🖼️ Uploads em http://localhost:${env.port}/uploads/...`);
// });
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
import { ensureUploadsDir, uploadsDir } from "./services/files.js";

const app = express();
await ensureUploadsDir();

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((item) => item.trim()),
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(uploadsDir, {
    fallthrough: false,
    index: false,
    immutable: false,
    maxAge: "1h",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.get("/api/health", (_req, res) => ok(res, { status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/routes", routesRouter);
app.use("/api/members", membersRouter);
app.use("/api/sponsors", sponsorsRouter);
app.use("/api/events", eventsRouter);

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor.",
    });
  },
);

app.use((_, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada.",
  });
});

const port = Number(process.env.PORT || env.port || 3001);

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Backend rodando em http://0.0.0.0:${port}`);
  console.log(`🖼️ Uploads em http://0.0.0.0:${port}/uploads/...`);
});
