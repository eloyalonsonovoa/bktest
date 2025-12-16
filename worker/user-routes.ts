import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, ScanEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { ScanRecord, ScanStatus, ScanVerdict } from "@shared/types";
// Helper for simulated scan
const simulateScan = (entity: ScanEntity) => {
  setTimeout(async () => {
    try {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
      const random = Math.random();
      let status: ScanStatus = 'completed';
      let verdict: ScanVerdict = 'clean';
      if (random > 0.9) {
        status = 'error';
      } else if (random > 0.7) {
        status = 'flagged';
        verdict = 'suspicious';
      }
      await entity.mutate(s => ({
        ...s,
        status,
        summary: {
          verdict,
          score: Math.floor(Math.random() * 100),
          reasons: status === 'flagged' ? ['Contains suspicious patterns'] : [],
        }
      }));
    } catch (e) {
      console.error(`Simulated scan failed for ${entity.id}`, e);
      try {
        await entity.patch({ status: 'error' });
      } catch (patchError) {
        console.error(`Failed to update entity status to error for ${entity.id}`, patchError);
      }
    }
  }, 0);
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // SCAN ROUTES
  app.post('/api/scan', async (c) => {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    if (!file) {
      return bad(c, 'File is required');
    }
    const scanId = crypto.randomUUID();
    const scanRecord: ScanRecord = {
      id: scanId,
      filename: file.name,
      size: file.size,
      mime: file.type,
      status: 'processing',
      ts: Date.now(),
      fields: {
        ...(title && { title }),
        ...(description && { description }),
      }
    };
    const entity = new ScanEntity(c.env, scanId);
    await ScanEntity.create(c.env, scanRecord);
    // Fire-and-forget simulated scan
    simulateScan(entity);
    return ok(c, { id: scanId, status: 'processing' });
  });
  app.get('/api/scans', async (c) => {
    await ScanEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ScanEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : 12);
    // Sort by timestamp descending
    page.items.sort((a, b) => b.ts - a.ts);
    return ok(c, page);
  });
  app.get('/api/scans/:id', async (c) => {
    const id = c.req.param('id');
    const entity = new ScanEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Scan not found');
    return ok(c, await entity.getState());
  });
  app.post('/api/scans/:id/retry', async (c) => {
    const id = c.req.param('id');
    const entity = new ScanEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Scan not found');
    await entity.patch({ status: 'processing', summary: undefined });
    simulateScan(entity);
    return ok(c, { id, status: 'processing' });
  });
  app.delete('/api/scans/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await ScanEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}