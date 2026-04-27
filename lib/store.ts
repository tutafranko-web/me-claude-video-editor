import { create } from 'zustand';
import type { Message, Operation } from '@/types/editor';
import { uid } from './utils';

interface EditorState {
  sourceFile: File | null;
  sourceUrl: string | null;
  previewUrl: string | null;
  operations: Operation[];
  messages: Message[];
  isProcessing: boolean;
  progress: number;
  error: string | null;

  setSource: (file: File) => void;
  addOperation: (op: Omit<Operation, 'id'>) => void;
  removeOperation: (id: string) => void;
  pushMessage: (m: Omit<Message, 'id' | 'ts'>) => void;
  setProcessing: (b: boolean) => void;
  setProgress: (p: number) => void;
  setPreviewUrl: (url: string | null) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  sourceFile: null,
  sourceUrl: null,
  previewUrl: null,
  operations: [],
  messages: [],
  isProcessing: false,
  progress: 0,
  error: null,

  setSource: (file) => {
    const prev = get().sourceUrl;
    if (prev) URL.revokeObjectURL(prev);
    const url = URL.createObjectURL(file);
    set({
      sourceFile: file,
      sourceUrl: url,
      previewUrl: url,
      operations: [],
      messages: [
        {
          id: uid(),
          role: 'assistant',
          text: `Loaded "${file.name}". Try: "trim first 5 seconds" or "grayscale".`,
          ts: Date.now(),
        },
      ],
      error: null,
    });
  },

  addOperation: (op) =>
    set((s) => ({
      operations: [...s.operations, { ...op, id: uid() } as Operation],
    })),

  removeOperation: (id) =>
    set((s) => ({ operations: s.operations.filter((o) => o.id !== id) })),

  pushMessage: (m) =>
    set((s) => ({
      messages: [...s.messages, { ...m, id: uid(), ts: Date.now() }],
    })),

  setProcessing: (b) => set({ isProcessing: b }),
  setProgress: (p) => set({ progress: p }),
  setPreviewUrl: (url) => {
    const prev = get().previewUrl;
    const src = get().sourceUrl;
    if (prev && prev !== src) URL.revokeObjectURL(prev);
    set({ previewUrl: url });
  },
  setError: (e) => set({ error: e }),
  reset: () => set({ operations: [], error: null }),
}));
