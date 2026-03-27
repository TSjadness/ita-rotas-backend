import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:5173,https://ita-rotas.vercel.app',
  jwtSecret: process.env.JWT_SECRET || 'troque-esta-chave-em-producao',
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 5)
};
