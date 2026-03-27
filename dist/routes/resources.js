import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { uploadSingleImage, uploadMultipleImages, } from "../middleware/upload.js";
import { removeLocalUploadIfExists } from "../services/files.js";
import { prisma } from "../services/prisma.js";
import { fail, ok } from "../utils/http.js";
const gallerySchema = z.object({
    title: z.string().min(2),
    description: z.string().min(5),
    imageUrl: z.string().optional().default(""),
    date: z.string().optional().default(""),
    time: z.string().optional().default(""),
    location: z.string().optional().default(""),
    mapLink: z.string().url().or(z.literal("")).optional().default(""),
    eventName: z.string().optional().default(""),
    coverIndex: z.coerce.number().int().min(0).optional().default(0),
    coverImageId: z.string().optional(),
    removedImageIds: z.string().optional().default(""),
});
const routeSchema = z.object({
    title: z.string().min(2),
    description: z.string().min(5),
    imageUrl: z.string().min(1),
    date: z.string().min(1),
    time: z.string().min(1),
    location: z.string().min(2),
    routeLink: z.string().url().or(z.literal("")),
    mapsLink: z.string().url().or(z.literal("")),
    gpsCoordinates: z.string().optional().default(""),
    distance: z.string().optional().default(""),
    difficulty: z.string().optional().default(""),
});
const memberSchema = z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    moto: z.string().min(2),
    photo: z.string().min(1),
});
const sponsorSchema = z.object({
    name: z.string().min(2),
    logo: z.string().min(1),
    description: z.string().min(5),
    link: z.string().url().optional().or(z.literal("")),
});
const eventSchema = z.object({
    name: z.string().min(2),
    date: z.string().min(1),
    time: z.string().min(1),
    location: z.string().min(2),
    description: z.string().min(5),
});
function getParamId(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
function getImageValue(key, body, fileUrl) {
    const maybeRemove = String(body.removeImage || "").toLowerCase() === "true";
    switch (key) {
        case "routes":
            return maybeRemove ? "" : fileUrl || String(body.imageUrl || "");
        case "members":
            return maybeRemove ? "" : fileUrl || String(body.photo || "");
        case "sponsors":
            return maybeRemove ? "" : fileUrl || String(body.logo || "");
        default:
            return undefined;
    }
}
function parseRemovedIds(value) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
function mapGalleryItem(item) {
    const orderedImages = [...(item.images || [])].sort((a, b) => a.order - b.order);
    const cover = orderedImages.find((img) => img.isCover) || orderedImages[0] || null;
    const fallbackImage = item.imageUrl || "";
    const coverImage = cover?.imageUrl || fallbackImage;
    return {
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        imageUrl: coverImage,
        coverImage,
        date: item.date ?? "",
        time: item.time ?? "",
        location: item.location ?? "",
        mapLink: item.mapLink ?? "",
        eventName: item.eventName ?? "",
        images: orderedImages.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isCover: img.isCover,
            order: img.order,
            createdAt: img.createdAt.getTime(),
        })),
        createdAt: item.createdAt.getTime(),
    };
}
function createCrudRouter({ key, schema, imageField, }) {
    const router = Router();
    router.get("/", async (_req, res) => {
        switch (key) {
            case "gallery": {
                const data = await prisma.galleryItem.findMany({
                    include: {
                        images: {
                            orderBy: { order: "asc" },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });
                return ok(res, data.map(mapGalleryItem));
            }
            case "routes": {
                const data = await prisma.route.findMany({
                    orderBy: { createdAt: "desc" },
                });
                return ok(res, data.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                })));
            }
            case "members": {
                const data = await prisma.member.findMany({
                    orderBy: { createdAt: "desc" },
                });
                return ok(res, data.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                })));
            }
            case "sponsors": {
                const data = await prisma.sponsor.findMany({
                    orderBy: { createdAt: "desc" },
                });
                return ok(res, data.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                })));
            }
            case "events": {
                const data = await prisma.event.findMany({
                    orderBy: { createdAt: "desc" },
                });
                return ok(res, data.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                })));
            }
            default:
                return ok(res, []);
        }
    });
    router.get("/:id", async (req, res) => {
        const id = getParamId(req.params.id);
        if (!id) {
            return fail(res, "Registro não encontrado.", 404);
        }
        switch (key) {
            case "gallery": {
                const item = await prisma.galleryItem.findUnique({
                    where: { id },
                    include: {
                        images: {
                            orderBy: { order: "asc" },
                        },
                    },
                });
                if (!item)
                    return fail(res, "Registro não encontrado.", 404);
                return ok(res, mapGalleryItem(item));
            }
            case "routes": {
                const item = await prisma.route.findUnique({
                    where: { id },
                });
                if (!item)
                    return fail(res, "Registro não encontrado.", 404);
                return ok(res, { ...item, createdAt: item.createdAt.getTime() });
            }
            case "members": {
                const item = await prisma.member.findUnique({
                    where: { id },
                });
                if (!item)
                    return fail(res, "Registro não encontrado.", 404);
                return ok(res, { ...item, createdAt: item.createdAt.getTime() });
            }
            case "sponsors": {
                const item = await prisma.sponsor.findUnique({
                    where: { id },
                });
                if (!item)
                    return fail(res, "Registro não encontrado.", 404);
                return ok(res, { ...item, createdAt: item.createdAt.getTime() });
            }
            case "events": {
                const item = await prisma.event.findUnique({
                    where: { id },
                });
                if (!item)
                    return fail(res, "Registro não encontrado.", 404);
                return ok(res, { ...item, createdAt: item.createdAt.getTime() });
            }
            default:
                return fail(res, "Registro não encontrado.", 404);
        }
    });
    router.post("/", requireAuth, (req, res) => {
        if (key === "gallery") {
            return uploadMultipleImages(req, res, async (error) => {
                if (error) {
                    return fail(res, error.message || "Falha ao enviar imagens.", 400);
                }
                return handleCreate(req, res);
            });
        }
        if (!imageField)
            return handleCreate(req, res);
        uploadSingleImage(req, res, async (error) => {
            if (error) {
                return fail(res, error.message || "Falha ao enviar imagem.", 400);
            }
            return handleCreate(req, res);
        });
    });
    router.put("/:id", requireAuth, (req, res) => {
        if (key === "gallery") {
            return uploadMultipleImages(req, res, async (error) => {
                if (error) {
                    return fail(res, error.message || "Falha ao enviar imagens.", 400);
                }
                return handleUpdate(req, res);
            });
        }
        if (!imageField)
            return handleUpdate(req, res);
        uploadSingleImage(req, res, async (error) => {
            if (error) {
                return fail(res, error.message || "Falha ao enviar imagem.", 400);
            }
            return handleUpdate(req, res);
        });
    });
    router.delete("/:id", requireAuth, async (req, res) => {
        const id = getParamId(req.params.id);
        if (!id) {
            return fail(res, "Registro não encontrado.", 404);
        }
        switch (key) {
            case "gallery": {
                const existing = await prisma.galleryItem.findUnique({
                    where: { id },
                    include: {
                        images: true,
                    },
                });
                if (!existing)
                    return fail(res, "Registro não encontrado.", 404);
                const galleryImages = existing.images ?? [];
                for (const image of galleryImages) {
                    await removeLocalUploadIfExists(image.imageUrl);
                }
                if (existing.imageUrl) {
                    await removeLocalUploadIfExists(existing.imageUrl);
                }
                await prisma.galleryItem.delete({
                    where: { id },
                });
                return ok(res, { deleted: true, id });
            }
            case "routes": {
                const existing = await prisma.route.findUnique({
                    where: { id },
                });
                if (!existing)
                    return fail(res, "Registro não encontrado.", 404);
                if (existing.imageUrl) {
                    await removeLocalUploadIfExists(existing.imageUrl);
                }
                await prisma.route.delete({
                    where: { id },
                });
                return ok(res, { deleted: true, id });
            }
            case "members": {
                const existing = await prisma.member.findUnique({
                    where: { id },
                });
                if (!existing)
                    return fail(res, "Registro não encontrado.", 404);
                if (existing.photo) {
                    await removeLocalUploadIfExists(existing.photo);
                }
                await prisma.member.delete({
                    where: { id },
                });
                return ok(res, { deleted: true, id });
            }
            case "sponsors": {
                const existing = await prisma.sponsor.findUnique({
                    where: { id },
                });
                if (!existing)
                    return fail(res, "Registro não encontrado.", 404);
                if (existing.logo) {
                    await removeLocalUploadIfExists(existing.logo);
                }
                await prisma.sponsor.delete({
                    where: { id },
                });
                return ok(res, { deleted: true, id });
            }
            case "events": {
                const existing = await prisma.event.findUnique({
                    where: { id },
                });
                if (!existing)
                    return fail(res, "Registro não encontrado.", 404);
                await prisma.event.delete({
                    where: { id },
                });
                return ok(res, { deleted: true, id });
            }
            default:
                return fail(res, "Registro não encontrado.", 404);
        }
    });
    async function handleCreate(req, res) {
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        const uploadedFiles = Array.isArray(req.files)
            ? req.files
            : [];
        const body = { ...req.body };
        if (imageField && key !== "gallery") {
            body[imageField] = getImageValue(key, body, fileUrl);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            if (fileUrl)
                await removeLocalUploadIfExists(fileUrl);
            for (const file of uploadedFiles) {
                await removeLocalUploadIfExists(`/uploads/${file.filename}`);
            }
            return fail(res, "Dados inválidos.", 422, parsed.error.flatten());
        }
        switch (key) {
            case "gallery": {
                const payload = parsed.data;
                const files = uploadedFiles.map((file) => `/uploads/${file.filename}`);
                const hasFiles = files.length > 0;
                const coverIndex = Math.min(payload.coverIndex ?? 0, Math.max(files.length - 1, 0));
                if (!hasFiles && !payload.imageUrl) {
                    return fail(res, "Envie ao menos uma imagem para a galeria.", 422);
                }
                const created = await prisma.galleryItem.create({
                    data: {
                        title: payload.title,
                        description: payload.description,
                        imageUrl: hasFiles ? files[coverIndex] : payload.imageUrl || "",
                        date: payload.date || "",
                        time: payload.time || "",
                        location: payload.location || "",
                        mapLink: payload.mapLink || "",
                        eventName: payload.eventName || "",
                        images: hasFiles
                            ? {
                                create: files.map((imageUrl, index) => ({
                                    imageUrl,
                                    isCover: index === coverIndex,
                                    order: index,
                                })),
                            }
                            : undefined,
                    },
                    include: {
                        images: {
                            orderBy: { order: "asc" },
                        },
                    },
                });
                return ok(res, mapGalleryItem(created), 201);
            }
            case "routes": {
                const created = await prisma.route.create({
                    data: parsed.data,
                });
                return ok(res, { ...created, createdAt: created.createdAt.getTime() }, 201);
            }
            case "members": {
                const created = await prisma.member.create({
                    data: parsed.data,
                });
                return ok(res, { ...created, createdAt: created.createdAt.getTime() }, 201);
            }
            case "sponsors": {
                const payload = parsed.data;
                const created = await prisma.sponsor.create({
                    data: {
                        ...payload,
                        link: payload.link || null,
                    },
                });
                return ok(res, { ...created, createdAt: created.createdAt.getTime() }, 201);
            }
            case "events": {
                const created = await prisma.event.create({
                    data: parsed.data,
                });
                return ok(res, { ...created, createdAt: created.createdAt.getTime() }, 201);
            }
            default:
                return fail(res, "Recurso não suportado.", 400);
        }
    }
    async function handleUpdate(req, res) {
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        const uploadedFiles = Array.isArray(req.files)
            ? req.files
            : [];
        const id = getParamId(req.params.id);
        if (!id) {
            if (fileUrl)
                await removeLocalUploadIfExists(fileUrl);
            for (const file of uploadedFiles) {
                await removeLocalUploadIfExists(`/uploads/${file.filename}`);
            }
            return fail(res, "Registro não encontrado.", 404);
        }
        switch (key) {
            case "gallery": {
                const existing = await prisma.galleryItem.findUnique({
                    where: { id },
                    include: {
                        images: {
                            orderBy: { order: "asc" },
                        },
                    },
                });
                if (!existing) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    for (const file of uploadedFiles) {
                        await removeLocalUploadIfExists(`/uploads/${file.filename}`);
                    }
                    return fail(res, "Registro não encontrado.", 404);
                }
                const parsed = schema.safeParse({
                    title: req.body.title ?? existing.title,
                    description: req.body.description ?? existing.description ?? "",
                    imageUrl: req.body.imageUrl ?? existing.imageUrl ?? "",
                    date: req.body.date ?? existing.date ?? "",
                    time: req.body.time ?? existing.time ?? "",
                    location: req.body.location ?? existing.location ?? "",
                    mapLink: req.body.mapLink ?? existing.mapLink ?? "",
                    eventName: req.body.eventName ?? existing.eventName ?? "",
                    coverIndex: req.body.coverIndex ?? 0,
                    coverImageId: req.body.coverImageId ?? "",
                    removedImageIds: req.body.removedImageIds ?? "",
                });
                if (!parsed.success) {
                    for (const file of uploadedFiles) {
                        await removeLocalUploadIfExists(`/uploads/${file.filename}`);
                    }
                    return fail(res, "Dados inválidos.", 422, parsed.error.flatten());
                }
                const payload = parsed.data;
                const removedIds = parseRemovedIds(payload.removedImageIds || "");
                if (removedIds.length > 0) {
                    const imagesToRemove = existing.images.filter((img) => removedIds.includes(img.id));
                    for (const image of imagesToRemove) {
                        await removeLocalUploadIfExists(image.imageUrl);
                    }
                    await prisma.galleryImage.deleteMany({
                        where: {
                            id: { in: removedIds },
                            galleryItemId: existing.id,
                        },
                    });
                }
                const newFiles = uploadedFiles.map((file) => `/uploads/${file.filename}`);
                if (newFiles.length > 0) {
                    const remainingCount = await prisma.galleryImage.count({
                        where: { galleryItemId: existing.id },
                    });
                    await prisma.galleryImage.createMany({
                        data: newFiles.map((imageUrl, index) => ({
                            galleryItemId: existing.id,
                            imageUrl,
                            isCover: false,
                            order: remainingCount + index,
                        })),
                    });
                }
                let currentImages = await prisma.galleryImage.findMany({
                    where: { galleryItemId: existing.id },
                    orderBy: { order: "asc" },
                });
                let coverImageId = payload.coverImageId || "";
                if (!coverImageId && currentImages.length > 0) {
                    const safeIndex = Math.min(payload.coverIndex ?? 0, currentImages.length - 1);
                    coverImageId = currentImages[safeIndex]?.id || "";
                }
                if (coverImageId) {
                    await prisma.galleryImage.updateMany({
                        where: { galleryItemId: existing.id },
                        data: { isCover: false },
                    });
                    await prisma.galleryImage.update({
                        where: { id: coverImageId },
                        data: { isCover: true },
                    });
                }
                currentImages = await prisma.galleryImage.findMany({
                    where: { galleryItemId: existing.id },
                    orderBy: { order: "asc" },
                });
                const currentCover = currentImages.find((img) => img.isCover) || currentImages[0] || null;
                const updated = await prisma.galleryItem.update({
                    where: { id },
                    data: {
                        title: payload.title,
                        description: payload.description,
                        imageUrl: currentCover?.imageUrl || payload.imageUrl || "",
                        date: payload.date || "",
                        time: payload.time || "",
                        location: payload.location || "",
                        mapLink: payload.mapLink || "",
                        eventName: payload.eventName || "",
                    },
                    include: {
                        images: {
                            orderBy: { order: "asc" },
                        },
                    },
                });
                if (existing.imageUrl &&
                    existing.imageUrl !== updated.imageUrl &&
                    !currentImages.some((img) => img.imageUrl === existing.imageUrl)) {
                    await removeLocalUploadIfExists(existing.imageUrl);
                }
                return ok(res, mapGalleryItem(updated));
            }
            case "routes": {
                const existing = await prisma.route.findUnique({
                    where: { id },
                });
                if (!existing) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    return fail(res, "Registro não encontrado.", 404);
                }
                const body = { ...req.body };
                if (imageField) {
                    body[imageField] = getImageValue(key, { ...existing, ...body }, fileUrl);
                }
                const parsed = schema.safeParse({
                    title: body.title ?? existing.title,
                    description: body.description ?? existing.description ?? "",
                    imageUrl: body.imageUrl ?? existing.imageUrl ?? "",
                    date: body.date ?? existing.date,
                    time: body.time ?? existing.time,
                    location: body.location ?? existing.location,
                    routeLink: body.routeLink ?? existing.routeLink ?? "",
                    mapsLink: body.mapsLink ?? existing.mapsLink ?? "",
                    gpsCoordinates: body.gpsCoordinates ?? existing.gpsCoordinates ?? "",
                    distance: body.distance ?? existing.distance ?? "",
                    difficulty: body.difficulty ?? existing.difficulty ?? "",
                });
                if (!parsed.success) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    return fail(res, "Dados inválidos.", 422, parsed.error.flatten());
                }
                if (existing.imageUrl && existing.imageUrl !== parsed.data.imageUrl) {
                    await removeLocalUploadIfExists(existing.imageUrl);
                }
                const updated = await prisma.route.update({
                    where: { id },
                    data: parsed.data,
                });
                return ok(res, { ...updated, createdAt: updated.createdAt.getTime() });
            }
            case "members": {
                const existing = await prisma.member.findUnique({
                    where: { id },
                });
                if (!existing) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    return fail(res, "Registro não encontrado.", 404);
                }
                const body = { ...req.body };
                if (imageField) {
                    body[imageField] = getImageValue(key, { ...existing, ...body }, fileUrl);
                }
                const parsed = schema.safeParse({
                    name: body.name ?? existing.name,
                    city: body.city ?? existing.city ?? "",
                    moto: body.moto ?? existing.moto ?? "",
                    photo: body.photo ?? existing.photo ?? "",
                });
                if (!parsed.success) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    return fail(res, "Dados inválidos.", 422, parsed.error.flatten());
                }
                if (existing.photo && existing.photo !== parsed.data.photo) {
                    await removeLocalUploadIfExists(existing.photo);
                }
                const updated = await prisma.member.update({
                    where: { id },
                    data: parsed.data,
                });
                return ok(res, { ...updated, createdAt: updated.createdAt.getTime() });
            }
            case "sponsors": {
                const existing = await prisma.sponsor.findUnique({
                    where: { id },
                });
                if (!existing) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    return fail(res, "Registro não encontrado.", 404);
                }
                const body = { ...req.body };
                if (imageField) {
                    body[imageField] = getImageValue(key, { ...existing, ...body }, fileUrl);
                }
                const parsed = schema.safeParse({
                    name: body.name ?? existing.name,
                    logo: body.logo ?? existing.logo ?? "",
                    description: body.description ?? existing.description ?? "",
                    link: body.link ?? existing.link ?? "",
                });
                if (!parsed.success) {
                    if (fileUrl)
                        await removeLocalUploadIfExists(fileUrl);
                    return fail(res, "Dados inválidos.", 422, parsed.error.flatten());
                }
                if (existing.logo && existing.logo !== parsed.data.logo) {
                    await removeLocalUploadIfExists(existing.logo);
                }
                const updated = await prisma.sponsor.update({
                    where: { id },
                    data: {
                        ...parsed.data,
                        link: parsed.data.link || null,
                    },
                });
                return ok(res, { ...updated, createdAt: updated.createdAt.getTime() });
            }
            case "events": {
                const existing = await prisma.event.findUnique({
                    where: { id },
                });
                if (!existing) {
                    return fail(res, "Registro não encontrado.", 404);
                }
                const parsed = schema.safeParse({
                    name: req.body.name ?? existing.name,
                    date: req.body.date ?? existing.date,
                    time: req.body.time ?? existing.time,
                    location: req.body.location ?? existing.location ?? "",
                    description: req.body.description ?? existing.description ?? "",
                });
                if (!parsed.success) {
                    return fail(res, "Dados inválidos.", 422, parsed.error.flatten());
                }
                const updated = await prisma.event.update({
                    where: { id },
                    data: parsed.data,
                });
                return ok(res, { ...updated, createdAt: updated.createdAt.getTime() });
            }
            default:
                if (fileUrl)
                    await removeLocalUploadIfExists(fileUrl);
                return fail(res, "Recurso não suportado.", 400);
        }
    }
    return router;
}
export const galleryRouter = createCrudRouter({
    key: "gallery",
    schema: gallerySchema,
});
export const routesRouter = createCrudRouter({
    key: "routes",
    schema: routeSchema,
    imageField: "imageUrl",
});
export const membersRouter = createCrudRouter({
    key: "members",
    schema: memberSchema,
    imageField: "photo",
});
export const sponsorsRouter = createCrudRouter({
    key: "sponsors",
    schema: sponsorSchema,
    imageField: "logo",
});
export const eventsRouter = createCrudRouter({
    key: "events",
    schema: eventSchema,
});
