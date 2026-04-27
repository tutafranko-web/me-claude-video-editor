'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function UploadDropzone() {
  const setSource = useEditorStore((s) => s.setSource);
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith('video/')) return;
      setSource(file);
    },
    [setSource],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-3 cursor-pointer',
        'w-full max-w-[640px] aspect-video rounded-2xl',
        'border-2 border-dashed transition-colors',
        hover
          ? 'border-accent bg-accent/5'
          : 'border-border bg-panel/40 hover:border-neutral-600',
      )}
    >
      <Upload className="size-8 text-neutral-500" />
      <div className="text-center">
        <div className="text-[15px] font-medium text-neutral-200">
          Drop a video here, or click to browse
        </div>
        <div className="text-[12px] text-neutral-500 mt-1">
          MP4 recommended · processed in your browser
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
      />
    </div>
  );
}
