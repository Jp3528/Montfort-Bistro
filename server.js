const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const INITIAL_PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Prohibido');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback a index.html para Single Page App
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (errHtml, data) => {
        if (errHtml) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 No Encontrado');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (errFile, content) => {
      if (errFile) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Error Interno del Servidor');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

function startServer(port) {
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('====================================================');
    console.log('  MONTFORT BISTRO — SERVIDOR LOCAL EN EJECUCIÓN');
    console.log('====================================================');
    console.log(`> URL Local:   ${url}`);
    console.log(`> Directorio:  ${PUBLIC_DIR}`);
    console.log(`> Estado:      Activo y escuchando peticiones 24/7`);
    console.log('====================================================');
    console.log('Para detener el servidor, presiona: Ctrl + C\n');

    // Abrir automáticamente en el navegador predeterminado de Windows
    const startCmd = process.platform === 'win32' ? `start ${url}` : `open ${url}`;
    exec(startCmd, (err) => {
      if (!err) {
        console.log(`[INFO] Navegador abierto automáticamente en ${url}`);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[AVISO] El puerto ${port} está en uso. Probando puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[ERROR]', err.message);
    }
  });
}

startServer(INITIAL_PORT);
