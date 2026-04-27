export type Operation =
  | { id: string; kind: 'trim'; startSec: number; endSec: number }
  | {
      id: string;
      kind: 'filter';
      filter: 'grayscale' | 'brightness' | 'contrast';
      value?: number;
    }
  | { id: string; kind: 'speed'; multiplier: number }
  | { id: string; kind: 'crop'; x: number; y: number; w: number; h: number };

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
};

export type WorkerInbound = {
  type: 'process';
  fileBuffer: ArrayBuffer;
  fileName: string;
  args: string[];
  outputName: string;
};

export type WorkerOutbound =
  | { type: 'ready' }
  | { type: 'progress'; ratio: number }
  | { type: 'done'; buffer: ArrayBuffer }
  | { type: 'error'; message: string };
