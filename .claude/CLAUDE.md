# Claude Video Editor — agent context

This is a browser-based video editor built with Next.js 14 + FFmpeg.wasm in a Web Worker. The app lives entirely in the user's browser.

## Architecture cheatsheet

- **Single source of truth**: `lib/store.ts` (Zustand). All UI reads from it; no prop drilling.
- **Operations are immutable, ordered**: `operations: Operation[]` in the store. Adding/removing triggers a re-render via the `useEffect` in `components/canvas-preview.tsx`.
- **One FFmpeg call per render**: `lib/ffmpeg-commands.ts` chains all `Operation[]` into a single `ffmpeg` invocation. Do not split into multiple calls.
- **Worker owns FFmpeg**: `workers/ffmpeg.worker.ts` is the only place that touches `@ffmpeg/ffmpeg`. UI thread only sees `postMessage`.
- **Bilingual parser**: `lib/prompt-parser.ts` is regex-based, supports EN + HR. Add new patterns there, not in components.

## Available skills (use proactively)

These skills are installed globally. Use them when the situation matches:

- **hyperframes** — when generating sample video assets (demo clips, marketing trailers for the editor itself, README hero videos). HTML→MP4 via GSAP timelines, deterministic renders.
- **hyperframes-cli** — `npx hyperframes init/preview/render/transcribe/tts`. Use for scaffolding a HyperFrames project to produce demo content.
- **website-to-hyperframes** — when asked to build a promo video from the editor's deployed URL (`me-claude-video-editor.vercel.app`).
- **video-use** — for editing real footage (talking heads, tutorials) outside the browser app. Treat the browser app and video-use as **complementary**: this app is the in-browser interactive UX; video-use is the conversational batch editor for raw footage. Cite them as separate use cases — don't try to merge.
- **frontend-design / ui-styling** — when adding new UI components to the editor. Stick to the Anthropic dark palette (`bg #0F0F0F`, `panel #1A1A1A`, `accent #D97757`).

## What this app is NOT

- Not a HyperFrames replacement — HyperFrames is for HTML→MP4 batch rendering with no UI; this is an interactive browser app.
- Not a video-use replacement — video-use is conversational CLI editing of full projects with transcripts; this app is single-clip browser-side FFmpeg.

## Conventions

- No comments unless WHY is non-obvious (per global CLAUDE.md).
- Tailwind classes only — no CSS-in-JS.
- All state mutations through Zustand actions (`addOperation`, `removeOperation`, etc.). Never mutate `operations` directly.
- New `Operation` kinds: add to `OperationBody` union in `types/editor.ts`, then update `lib/prompt-parser.ts` and `lib/ffmpeg-commands.ts` in lockstep.

## Deploy

- GitHub: `tutafranko-web/me-claude-video-editor`
- Vercel: `me-claude-video-editor.vercel.app` (auto-deploy on push to `main`)
- Headers (`vercel.json` + `next.config.js`) set COOP/COEP for SharedArrayBuffer — required by FFmpeg.wasm.
