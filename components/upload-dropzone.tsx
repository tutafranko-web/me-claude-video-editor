'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowUpFromLine, Film } from 'lucide-react';
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
    <div className="w-full max-w-[680px] flex flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-[28px] leading-tight tracking-tight text-ink">
          What should we edit today?
        </h1>
        <p className="text-[14px] text-muted">
          Drop a video and describe the cut you want.
        </p>
      </div>

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
          'group flex flex-col items-center justify-center gap-4 cursor-pointer',
          'w-full aspect-[16/9] rounded-3xl',
          'border border-dashed transition-all duration-200',
          hover
            ? 'border-accent bg-accentSoft/50 scale-[1.01]'
            : 'border-line bg-surface hover:border-faint hover:bg-warm/40',
        )}
      >
        <div
          className={cn(
            'size-14 rounded-2xl flex items-center justify-center transition-colors',
            hover ? 'bg-accent text-white' : 'bg-warm text-muted group-hover:text-ink',
          )}
        >
          {hover ? <ArrowUpFromLine className="size-6" /> : <Film className="size-6" />}
        </div>
        <div className="text-center">
          <div className="text-[15px] font-medium text-ink">
            {hover ? 'Drop it' : 'Drop a video here'}
          </div>
          <div className="text-[13px] text-muted mt-1">
            or click to browse · MP4 recommended
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

      <div className="flex flex-wrap gap-2 justify-center text-[12px] text-faint">
        <span>Try:</span>
        <span className="text-muted">"trim first 5 seconds"</span>
        <span>·</span>
        <span className="text-muted">"black and white"</span>
        <span>·</span>
        <span className="text-muted">"speed up 2x"</span>
      </div>
    </div>
  );
}
