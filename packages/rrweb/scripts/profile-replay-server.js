import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const distDir = path.join(pkgRoot, 'dist');
const harnessPath = path.join(__dirname, 'profile-replay.html');
const port = Number(process.env.PORT) || 4177;

const naturalOrder = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function listJsonFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => /\.(json|ndjson)$/i.test(name))
    .sort(naturalOrder.compare)
    .map((name) => path.join(dir, name));
}

function collectSessionFiles(args) {
  if (args.length) {
    const files = [];
    for (const arg of args) {
      const resolved = path.resolve(arg);
      if (!fs.existsSync(resolved)) {
        console.error(`Session path not found: ${resolved}`);
        process.exit(1);
      }
      if (fs.statSync(resolved).isDirectory()) {
        files.push(...listJsonFiles(resolved));
      } else {
        files.push(resolved);
      }
    }
    return files;
  }
  const defaultFile = path.join(pkgRoot, 'temp/session.json');
  const defaultDir = path.join(pkgRoot, 'temp/session');
  if (fs.existsSync(defaultFile)) return [defaultFile];
  if (fs.existsSync(defaultDir) && fs.statSync(defaultDir).isDirectory()) {
    return listJsonFiles(defaultDir);
  }
  return [];
}

const sessionFiles = collectSessionFiles(process.argv.slice(2));

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


const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    sendFile(res, harnessPath);
    return;
  }
  if (url.pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (url.pathname === '/session-parts') {
    send(
      res,
      200,
      JSON.stringify(
        sessionFiles.map((file, index) => ({
          index,
          name: path.basename(file),
          bytes: fs.statSync(file).size,
        })),
      ),
      mime['.json'],
    );
    return;
  }
  if (url.pathname.startsWith('/session-part/')) {
    const index = Number(url.pathname.slice('/session-part/'.length));
    if (!Number.isInteger(index) || !sessionFiles[index]) {
      send(res, 404, `no session part ${index}`);
      return;
    }
    sendFile(res, sessionFiles[index]);
    return;
  }
  if (url.pathname === '/session.json') {
    if (!sessionFiles.length) {
      send(res, 404, 'no session file; pass paths to the server or use the file picker');
      return;
    }
    sendFile(res, sessionFiles[0]);
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
  if (sessionFiles.length) {
    console.log(`  session:  ${sessionFiles.length} file(s), merged by timestamp`);
    for (const file of sessionFiles) console.log(`    - ${file}`);
    console.log('  They will autoload.');
  } else {
    console.log('  No session file. Drop one or more JSON files on the page, or:');
    console.log('  pnpm --filter @amplitude/rrweb profile-replay -- /path/to/chunk-*.json');
    console.log('  pnpm --filter @amplitude/rrweb profile-replay -- /path/to/session-dir');
  }
  console.log('');
  console.log('Chrome: open the batched tab, jump to just before the stall, start a');
  console.log('Performance recording on the parent page, click "Jump then play live".');
  console.log('Repeat in the baseline tab. Marks are named rrweb.applyMutation.');
});
