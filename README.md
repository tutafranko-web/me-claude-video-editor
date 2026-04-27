# Claude Video Editor

AI-first video editing in the browser. Describe edits in plain language ("trim first 5 seconds", "grayscale", "speed up 2x") and the app applies them via FFmpeg.wasm running in a Web Worker.

![Layout: Smart Blocks | Canvas Preview | Chat Sidebar](https://img.shields.io/badge/stack-Next.js%2014%20%C2%B7%20Tailwind%20%C2%B7%20Zustand%20%C2%B7%20FFmpeg.wasm-1A1A1A)

## Features

- **AI-first chat** — type what you want, no buttons or menus
- **Smart Blocks** — every operation is a removable block; clear edit history
- **Canvas-based preview** — frames drawn into `<canvas>` via `requestAnimationFrame` (ready for visual effects hooks)
- **Web Worker processing** — UI stays responsive during FFmpeg encoding
- **Bilingual parser** — English and Croatian commands both work

## Supported commands (EN / HR)

| Command (EN)                  | Croatian                  | Operation                |
| ----------------------------- | ------------------------- | ------------------------ |
| `trim first 5 seconds`        | `izreži prvih 5 sekundi`  | Trim 0s → 5s             |
| `cut from 2s to 8s`           | `izreži od 2s do 8s`      | Trim 2s → 8s             |
| `grayscale` / `black and white` | `crno-bijeli`           | Grayscale filter         |
| `increase brightness`         | `pojačaj svjetlinu`       | Brightness +0.2          |
| `increase contrast`           | `pojačaj kontrast`        | Contrast +0.3            |
| `speed up 2x`                 | `ubrzaj 2x`               | 2× playback speed        |
| `slow down by half`           | `uspori na pola`          | 0.5× playback speed      |

## Local development

```bash
pnpm install      # or: npm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), drop an `.mp4`, and start typing.

> **Note:** FFmpeg.wasm requires `SharedArrayBuffer`, which needs the `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. These are set in `next.config.js` and `vercel.json`.

## Deploy on Vercel

1. Push this repo to GitHub (already done if you're reading this).
2. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
3. Framework preset is auto-detected as **Next.js**. No env vars needed.
4. Click **Deploy**. Vercel will pick up `vercel.json` headers automatically.

Every push to `main` triggers a redeploy.

## Project structure

```
app/
  layout.tsx        # Dark theme, Inter font
  page.tsx          # 3-pane layout
components/
  canvas-preview.tsx  # Video → canvas + transport controls + worker lifecycle
  chat-sidebar.tsx    # Messages + prompt input
  smart-blocks.tsx    # Stack of applied operations
  upload-dropzone.tsx # Empty-state file picker
lib/
  store.ts          # Zustand store (single source of truth)
  prompt-parser.ts  # Text → Operation (regex, offline)
  ffmpeg-commands.ts# Operation[] → FFmpeg argv
  utils.ts
workers/
  ffmpeg.worker.ts  # Owns the FFmpeg instance
types/
  editor.ts
```

## Verification

1. `pnpm dev` → open `localhost:3000`, no console errors.
2. Drop any `.mp4` → first frame in the canvas.
3. Type `trim first 3 seconds` → preview updates, `Trim · 0s–3s` block appears.
4. Type `grayscale` → preview updates, `Grayscale` block appears.
5. Click `×` on the Grayscale block → color returns, still 3s long.
6. Type `speed up 2x` → ~1.5s clip in color.

## Tech notes

- **FFmpeg core** is loaded from `unpkg.com/@ffmpeg/core@0.12.6/dist/umd` via `toBlobURL` (avoids hosting WASM binaries in the repo).
- **One FFmpeg invocation per render** — the command builder chains all operations into a single `ffmpeg` call rather than re-encoding for each.
- **Filter ordering**: `trim` is applied via `-ss`/`-t` input flags (fastest), then video filters (`grayscale`, `brightness`, `contrast`, `speed`) are joined with `,` into one `-vf` chain.
- **Audio speed** uses `atempo` (clamped to FFmpeg's supported range).
