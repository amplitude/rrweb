import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const distDir = path.join(pkgRoot, 'dist');
const harnessPath = path.join(__dirname, 'profile-replay.html');
const port = Number(process.env.PORT) || 4177;

const sessionPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : fs.existsSync(path.join(pkgRoot, 'temp/session.json'))
  ? path.join(pkgRoot, 'temp/session.json')
  : null;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    send(res, 404, `not found: ${filePath}`);
    return;
  }
  const ext = path.extname(filePath);
  send(res, 200, fs.readFileSync(filePath), mime[ext] || 'application/octet-stream');
}

if (!fs.existsSync(path.join(distDir, 'rrweb.umd.cjs'))) {
  console.error('Missing dist/rrweb.umd.cjs. Run: pnpm --filter @amplitude/rrweb build');
  process.exit(1);
}

if (sessionPath && !fs.existsSync(sessionPath)) {
  console.error(`Session file not found: ${sessionPath}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    sendFile(res, harnessPath);
    return;
  }
  if (url.pathname === '/session.json') {
    if (!sessionPath) {
      send(res, 404, 'no session.json; pass a path to the server or use the file picker');
      return;
    }
    sendFile(res, sessionPath);
    return;
  }
  if (url.pathname.startsWith('/dist/')) {
    const relative = url.pathname.slice('/dist/'.length);
    sendFile(res, path.join(distDir, relative));
    return;
  }
  send(res, 404, 'not found');
});

server.listen(port, '127.0.0.1', () => {
  const base = `http://127.0.0.1:${port}`;
  console.log('Live mutation profile harness');
  console.log(`  batched:  ${base}/?batch=on`);
  console.log(`  baseline: ${base}/?batch=off`);
  if (sessionPath) {
    console.log(`  session:  ${sessionPath}`);
    console.log('  /session.json will autoload.');
  } else {
    console.log('  No session file. Use the file picker, or:');
    console.log('  pnpm --filter @amplitude/rrweb profile-replay -- /path/to/session.json');
  }
  console.log('');
  console.log('Chrome: open the batched tab, jump to just before the stall, start a');
  console.log('Performance recording on the parent page, click "Jump then play live".');
  console.log('Repeat in the baseline tab. Marks are named rrweb.applyMutation.');
});
