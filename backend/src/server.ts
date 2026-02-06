import { createApp } from './app';

async function main() {
  const app = await createApp();
  const port = Number(process.env.API_PORT ?? 8787);
  const host = process.env.API_HOST ?? '127.0.0.1';
  await app.listen({ port, host });
  app.log.info(`API listening on http://${host}:${port}`);
}

void main();
