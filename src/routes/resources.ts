import { Router } from 'express';
import { z, ZodTypeAny } from 'zod';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { readDb, updateCollection } from '../services/db.js';
import { removeLocalUploadIfExists } from '../services/files.js';
import { fail, ok } from '../utils/http.js';
import { DatabaseSchema } from '../types/index.js';

const gallerySchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  imageUrl: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(2),
  mapLink: z.string().url().or(z.literal('')),
  eventName: z.string().min(2)
});

const routeSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  imageUrl: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(2),
  routeLink: z.string().url().or(z.literal('')),
  mapsLink: z.string().url().or(z.literal('')),
  gpsCoordinates: z.string().optional().default(''),
  distance: z.string().optional().default(''),
  difficulty: z.string().optional().default('')
});

const memberSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  moto: z.string().min(2),
  photo: z.string().min(1)
});

const sponsorSchema = z.object({
  name: z.string().min(2),
  logo: z.string().min(1),
  description: z.string().min(5),
  link: z.string().url().optional().or(z.literal(''))
});

const eventSchema = z.object({
  name: z.string().min(2),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(2),
  description: z.string().min(5)
});

type ResourceConfig<K extends keyof DatabaseSchema> = {
  key: K;
  schema: ZodTypeAny;
  imageField?: string;
};

function getImageValue(key: keyof DatabaseSchema, body: Record<string, unknown>, fileUrl?: string) {
  const maybeRemove = String(body.removeImage || '').toLowerCase() === 'true';
  switch (key) {
    case 'gallery':
    case 'routes':
      return maybeRemove ? '' : (fileUrl || String(body.imageUrl || ''));
    case 'members':
      return maybeRemove ? '' : (fileUrl || String(body.photo || ''));
    case 'sponsors':
      return maybeRemove ? '' : (fileUrl || String(body.logo || ''));
    default:
      return undefined;
  }
}

function createCrudRouter<K extends keyof DatabaseSchema>({ key, schema, imageField }: ResourceConfig<K>) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const db = await readDb();
    const data = [...(db[key] as Array<{ createdAt?: number }>)].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return ok(res, data);
  });

  router.get('/:id', async (req, res) => {
    const db = await readDb();
    const item = (db[key] as Array<{ id: string }>).find((entry) => entry.id === req.params.id);
    if (!item) return fail(res, 'Registro não encontrado.', 404);
    return ok(res, item);
  });

  router.post('/', requireAuth, (req, res) => {
    if (!imageField) return handleCreate(req, res);
    uploadSingleImage(req, res, async (error) => {
      if (error) return fail(res, error.message || 'Falha ao enviar imagem.', 400);
      return handleCreate(req, res);
    });
  });

  router.put('/:id', requireAuth, (req, res) => {
    if (!imageField) return handleUpdate(req, res);
    uploadSingleImage(req, res, async (error) => {
      if (error) return fail(res, error.message || 'Falha ao enviar imagem.', 400);
      return handleUpdate(req, res);
    });
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const db = await readDb();
    const existing = (db[key] as unknown as Array<Record<string, string>>).find((item) => item.id === req.params.id);
    if (!existing) return fail(res, 'Registro não encontrado.', 404);

    if (imageField && typeof existing[imageField] === 'string') {
      await removeLocalUploadIfExists(existing[imageField]);
    }

    await updateCollection(key, (current) => (current as Array<{ id: string }>).filter((item) => item.id !== req.params.id) as unknown as DatabaseSchema[K]);
    return ok(res, { deleted: true, id: req.params.id });
  });

  async function handleCreate(req: any, res: any) {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const body = { ...req.body };
    if (imageField) body[imageField] = getImageValue(key, body, fileUrl);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      if (fileUrl) await removeLocalUploadIfExists(fileUrl);
      return fail(res, 'Dados inválidos.', 422, parsed.error.flatten());
    }

    const item = {
      ...parsed.data,
      ...(key === 'sponsors' && !parsed.data.link ? { link: undefined } : {}),
      id: uuid(),
      createdAt: Date.now()
    };

    const collection = await updateCollection(key, (current) => [item, ...(current as Array<unknown>)] as DatabaseSchema[K]);
    return ok(res, (collection as Array<unknown>)[0], 201);
  }

  async function handleUpdate(req: any, res: any) {
    const db = await readDb();
    const existing = (db[key] as unknown as Array<Record<string, string>>).find((entry) => entry.id === req.params.id);
    if (!existing) {
      if (req.file) await removeLocalUploadIfExists(`/uploads/${req.file.filename}`);
      return fail(res, 'Registro não encontrado.', 404);
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const body = { ...req.body };
    if (imageField) body[imageField] = getImageValue(key, { ...existing, ...body }, fileUrl);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      if (fileUrl) await removeLocalUploadIfExists(fileUrl);
      return fail(res, 'Dados inválidos.', 422, parsed.error.flatten());
    }

    const oldImageValue = imageField ? existing[imageField] : undefined;
    const newImageValue = imageField ? parsed.data[imageField] : undefined;
    if (imageField && oldImageValue && oldImageValue !== newImageValue) {
      await removeLocalUploadIfExists(oldImageValue);
    }

    let updatedItem: unknown = null;
    await updateCollection(key, (current) =>
      (current as unknown as Array<Record<string, unknown>>).map((item) => {
        if (item.id !== req.params.id) return item;
        updatedItem = {
          ...item,
          ...parsed.data,
          ...(key === 'sponsors' && !parsed.data.link ? { link: undefined } : {})
        };
        return updatedItem as Record<string, unknown>;
      }) as unknown as DatabaseSchema[K]
    );

    return ok(res, updatedItem);
  }

  return router;
}

export const galleryRouter = createCrudRouter({ key: 'gallery', schema: gallerySchema, imageField: 'imageUrl' });
export const routesRouter = createCrudRouter({ key: 'routes', schema: routeSchema, imageField: 'imageUrl' });
export const membersRouter = createCrudRouter({ key: 'members', schema: memberSchema, imageField: 'photo' });
export const sponsorsRouter = createCrudRouter({ key: 'sponsors', schema: sponsorSchema, imageField: 'logo' });
export const eventsRouter = createCrudRouter({ key: 'events', schema: eventSchema });
