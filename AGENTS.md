# Checkboard

Small Node app for Cursor cloud agents. The page is plain HTML, CSS, and JavaScript. The server is Node with no dependencies.

## Cloud environment

`.cursor/environment.json` installs dependencies and starts the dev server before the agent works. The server logs:

`Checkboard listening on http://127.0.0.1:3000`

If that terminal is not running, start it with `npm run dev`. Leave it running. Run checks with `npm test`.

Node 18 or newer is required. The default cloud image already includes Node, so this repo does not replace it with a custom image. A custom Dockerfile would drop the desktop and browser the agent uses to test the page.

## Browser check

Open http://127.0.0.1:3000 and walk through this:

1. The badge reads **Server ready**.
2. Type `Cloud agent check` and press **Add**. The task appears in the list.
3. Check its box. **0 left** updates, and the title is struck through.
4. Press **Done**. The new task stays visible. Press **Active**. It disappears.
5. Press **Load sample tasks**. Three sample tasks appear, including one that is already done.
6. Press **Clear done**. Completed tasks disappear.
7. Delete the remaining `Cloud agent check` task with its × button.

Tasks are stored in `localStorage` under `checkboard.tasks`. Reload keeps them. The sample list comes from `GET /api/samples`. The badge comes from `GET /api/health`.
