'use client';

import { X, Scissors, Palette, Gauge, Crop, Layers } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import type { Operation } from '@/types/editor';

function iconFor(op: Operation) {
  if (op.kind === 'trim') return <Scissors className="size-3.5" />;
  if (op.kind === 'filter') return <Palette className="size-3.5" />;
  if (op.kind === 'speed') return <Gauge className="size-3.5" />;
  return <Crop className="size-3.5" />;
}

function labelFor(op: Operation): string {
  if (op.kind === 'trim') return `Trim ${op.startSec}s – ${op.endSec}s`;
  if (op.kind === 'filter') {
    if (op.filter === 'grayscale') return 'Grayscale';
    if (op.filter === 'brightness')
      return `Brightness ${op.value && op.value > 0 ? '+' : ''}${op.value ?? 0}`;
    return `Contrast +${op.value ?? 0}`;
  }
  if (op.kind === 'speed') return `Speed ${op.multiplier}×`;
  return `Crop ${op.w}×${op.h}`;
}

export function SmartBlocks() {
  const operations = useEditorStore((s) => s.operations);
  const removeOperation = useEditorStore((s) => s.removeOperation);

  return (
    <>
      <header className="px-5 py-4 border-b border-line">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-muted" />
          <div className="text-[13px] font-medium text-ink">Edits</div>
          {operations.length > 0 && (
            <div className="ml-auto text-[11px] text-muted tabular-nums">
              {operations.length}
            </div>
          )}
        </div>
        <div className="text-[11px] text-muted mt-1">
          Applied in order, top to bottom
        </div>
      </header>

      {operations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div className="text-[12px] text-faint leading-relaxed">
            No edits yet.
            <br />
            Type a command in the chat
            <br />
            <span className="text-muted">→</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {operations.map((op, i) => (
            <div
              key={op.id}
              className="group relative flex items-center gap-3 rounded-2xl bg-surface border border-line px-3 py-2.5 hover:border-faint transition-colors"
            >
              <div className="flex flex-col items-center w-5 shrink-0">
                <div className="text-[10px] text-faint tabular-nums">{i + 1}</div>
              </div>
              <div className="size-7 rounded-lg bg-accentSoft text-accentDeep flex items-center justify-center shrink-0">
                {iconFor(op)}
              </div>
              <div className="flex-1 text-[13px] text-ink truncate">
                {labelFor(op)}
              </div>
              <button
                onClick={() => removeOperation(op.id)}
                className="size-6 rounded-md text-faint hover:text-ink hover:bg-warm flex items-center justify-center transition opacity-60 group-hover:opacity-100"
                aria-label="Remove edit"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
