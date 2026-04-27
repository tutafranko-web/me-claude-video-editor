/// <reference lib="webworker" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { WorkerInbound, WorkerOutbound } from '@/types/editor';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let ffmpeg: FFmpeg | null = null;

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  const instance = new FFmpeg();
  instance.on('progress', ({ progress }) => {
    const msg: WorkerOutbound = { type: 'progress', ratio: Math.max(0, Math.min(1, progress)) };
    ctx.postMessage(msg);
  });
  await instance.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  ffmpeg = instance;
  return instance;
}

ctx.addEventListener('message', async (e: MessageEvent<WorkerInbound>) => {
  const data = e.data;
  if (data.type !== 'process') return;
  try {
    const ff = await getFfmpeg();
    await ff.writeFile(data.fileName, new Uint8Array(data.fileBuffer));
    await ff.exec(data.args);
    const out = await ff.readFile(data.outputName);
    const buffer =
      out instanceof Uint8Array
        ? out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
        : new TextEncoder().encode(out as unknown as string).buffer;
    try {
      await ff.deleteFile(data.fileName);
      await ff.deleteFile(data.outputName);
    } catch {
      // ignore cleanup errors
    }
    const done: WorkerOutbound = { type: 'done', buffer: buffer as ArrayBuffer };
    ctx.postMessage(done, [buffer as ArrayBuffer]);
  } catch (err) {
    const msg: WorkerOutbound = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(msg);
  }
});

ctx.postMessage({ type: 'ready' } satisfies WorkerOutbound);
