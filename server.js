import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");

const SAMPLES = [
  { title: "Open this page in the cloud agent browser", done: false },
  { title: "Add a task and mark it done", done: false },
  { title: "Confirm the Done filter hides active tasks", done: true },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function resolvePublicFile(urlPath) {
  const requested = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const decoded = decodeURIComponent(requested.split("?")[0]);
  const filePath = path.resolve(publicDir, decoded);
  const relative = path.relative(publicDir, filePath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return filePath;
}

export function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "checkboard" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/samples") {
      sendJson(res, 200, { tasks: SAMPLES });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "method not allowed" });
      return;
    }

    let filePath;
    try {
      filePath = resolvePublicFile(url.pathname);
    } catch {
      sendJson(res, 400, { error: "bad path" });
      return;
    }

    if (!filePath) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        sendJson(res, 404, { error: "not found" });
        return;
      }

      res.writeHead(200, {
        "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
        "Content-Length": stat.size,
        "Cache-Control": "no-store",
      });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

export function listen(port = 0, host = "0.0.0.0") {
  const server = createApp();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      resolve({ server, port: address.port, host });
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "0.0.0.0";
  listen(port, host).then(({ port: bound }) => {
    console.log(`Checkboard listening on http://127.0.0.1:${bound}`);
  });
}
