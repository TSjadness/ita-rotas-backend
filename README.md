# Iron and Vines Backend

Backend em Node.js + Express + TypeScript para o projeto ITAROTA79.

## Recursos
- Login com JWT
- CRUD de galeria, rotas, membros, patrocinadores e eventos
- Upload seguro de imagens com preview no frontend
- Persistência em `src/data/db.json`
- Exclusão automática da imagem antiga ao editar/remover registros

## Rodando
```bash
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell, se `npm` estiver bloqueado:
```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

## Variáveis
Veja `.env.example`.

## Login inicial
- usuário: `admin`
- senha: `123`

## Uploads
As imagens ficam em `src/uploads` e são servidas em `/uploads/...`.

Campos com upload:
- galeria → `image`
- rotas → `image`
- membros → `image`
- patrocinadores → `image`

Também é aceito `removeImage=true` nos updates para remover a imagem atual.
"# ita-rotas-backend" 
