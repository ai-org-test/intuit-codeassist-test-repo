# Checkboard

A one-page task list a Cursor cloud agent can install, run, and test in the browser.

The UI is HTML, CSS, and JavaScript. The server is Node (`server.js`) and has no npm dependencies. It serves the page and two JSON routes:

- `GET /api/health` — `{ "ok": true, "service": "checkboard" }`
- `GET /api/samples` — starter tasks the **Load sample tasks** button inserts

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000. `npm test` checks the routes and the page markup.

## Cloud agents

The committed `.cursor/environment.json` is the setup cloud agents read. On a run, the agent installs dependencies and starts `npm run dev` in a terminal named Checkboard. The page is at http://127.0.0.1:3000. `AGENTS.md` lists the clicks to verify.
# intuit-codeassist-test-repo
