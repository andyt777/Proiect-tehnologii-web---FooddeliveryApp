# Stage 3: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 12 Oct 2026 (Claude Code has no share link): reading the stage 3 guide, creating the Vite project, moving the data and styles, README.

## Key requests
### 1. Project setup
- Asked: follow the stage 3 guide: move the old files to `mockup/`, create the React project with Vite in `frontend/`, remove the demo files.
- Got: `git mv` of index.html, style.css and comenzi.js into `mockup/` (so Git sees them as renamed), `create-vite` with the React template and ESLint, `npm install`, and the demo files deleted (assets/, favicon.svg, icons.svg, index.css).
- Changed or rejected: The first run without questions picked Oxlint by default; it was redone with `--eslint`, because the guide asks for ESLint.

### 2. App.jsx
- Asked: move the stage 2 data into the main component and compute the header values from it.
- Got: the `comenzi` array above `App`, the header from the mockup with `className` instead of `class`, and the numbers between braces: `{comenzi.length}` orders, `{peDrum}` on the way, `{livrate} din {comenzi.length}` delivered, `{total} lei` spent (with `reduce`). The list is shown as JSON in a `<pre>`.
- Changed or rejected: Kept it. I kept the whole Savoro header (top bar, stats, categories), not only the title and counter like in the TaskFlow example.

### 3. Checks
- Asked: check that the project builds and that node_modules is not committed.
- Got: `npm run lint` and `npm run build` with no errors, `git status --short` shows only the frontend files and the three renames.
- Changed or rejected: Kept it.

## What I learned / what did not work
- The page now runs on a local server (`npm run dev`), it no longer works by double-clicking index.html, because the files load each other with `import`.
- `node_modules/` can always be recreated from `package.json` with `npm install`, so it is ignored by the `.gitignore` that Vite generates.
- After deleting `index.css` the page went white with a 404 in the console, because `main.jsx` still imported it; replacing the import with `./App.css` fixed it without restarting the server.
- In JSX, `class` becomes `className`, every tag must be closed and a comment is written as `{/* ... */}`.
- The data array stays above the `App` function: React calls `App` again on every update, so anything inside it would be recreated each time.
