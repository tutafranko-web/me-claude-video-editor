'use client';

import { GripVertical, X, Scissors, Palette, Gauge, Crop } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import type { Operation } from '@/types/editor';

function iconFor(op: Operation) {
  if (op.kind === 'trim') return <Scissors className="size-3.5" />;
  if (op.kind === 'filter') return <Palette className="size-3.5" />;
  if (op.kind === 'speed') return <Gauge className="size-3.5" />;
  return <Crop className="size-3.5" />;
}

function labelFor(op: Operation): string {
  if (op.kind === 'trim') return `Trim · ${op.startSec}s–${op.endSec}s`;
  if (op.kind === 'filter') {
    if (op.filter === 'grayscale') return 'Grayscale';
    if (op.filter === 'brightness')
      return `Brightness ${op.value && op.value > 0 ? '+' : ''}${op.value ?? 0}`;
    return `Contrast +${op.value ?? 0}`;
  }
  if (op.kind === 'speed') return `Speed ${op.multiplier}x`;
  return `Crop ${op.w}×${op.h}`;
}

export function SmartBlocks() {
  const operations = useEditorStore((s) => s.operations);
  const removeOperation = useEditorStore((s) => s.removeOperation);

  if (operations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div className="text-[12px] text-neutral-600 leading-relaxed">
          No edits yet.
          <br />
          Type a command in the chat →
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
      {operations.map((op) => (
        <div
          key={op.id}
          className="group flex items-center gap-2 rounded-md bg-bg/60 border border-border px-2 py-2 hover:border-neutral-600 transition-colors"
        >
          <GripVertical className="size-3.5 text-neutral-700 shrink-0" />
          <div className="size-6 rounded bg-accent/15 text-accent flex items-center justify-center shrink-0">
            {iconFor(op)}
          </div>
          <div className="flex-1 text-[13px] text-neutral-200 truncate">
            {labelFor(op)}
          </div>
          <button
            onClick={() => removeOperation(op.id)}
            className="size-6 rounded text-neutral-500 hover:text-neutral-100 hover:bg-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            aria-label="Remove block"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
