import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function resolveRequest(url) {
  const rawPath = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const filePath = rawPath === '/' ? '/index.html' : rawPath;
  const resolved = normalize(join(root, filePath));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = createServer(async (req, res) => {
  const file = resolveRequest(req.url || '/');
  if (!file || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`KORA 35 monitor: http://localhost:${port}`);
});
