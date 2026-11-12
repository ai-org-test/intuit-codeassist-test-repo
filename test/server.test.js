import assert from "node:assert/strict";
import test from "node:test";
import { listen } from "../server.js";

async function withServer(fn) {
  const { server, port } = await listen(0, "127.0.0.1");
  try {
    await fn(port);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test("health and sample endpoints respond", async () => {
  await withServer(async (port) => {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, service: "checkboard" });

    const samples = await fetch(`http://127.0.0.1:${port}/api/samples`);
    const body = await samples.json();
    assert.equal(samples.status, 200);
    assert.ok(body.tasks.length >= 3);
    assert.equal(typeof body.tasks[0].title, "string");
  });
});

test("index page includes the controls a browser test clicks", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    for (const id of ["task-input", "add-task", "load-samples", "filter-done", "task-list"]) {
      assert.match(html, new RegExp(`data-testid="${id}"`));
    }

    const script = await fetch(`http://127.0.0.1:${port}/app.js`);
    const css = await fetch(`http://127.0.0.1:${port}/styles.css`);
    assert.equal(script.status, 200);
    assert.equal(css.status, 200);
  });
});

test("path traversal and missing files are rejected", async () => {
  await withServer(async (port) => {
    const escaped = await fetch(`http://127.0.0.1:${port}/%2e%2e%2fserver.js`);
    assert.equal(escaped.status, 403);

    const missing = await fetch(`http://127.0.0.1:${port}/missing.txt`);
    assert.equal(missing.status, 404);

    const posted = await fetch(`http://127.0.0.1:${port}/api/health`, { method: "POST" });
    assert.equal(posted.status, 405);
  });
});
