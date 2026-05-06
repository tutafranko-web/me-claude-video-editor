'use client';

import { Sparkles } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { SmartBlocks } from '@/components/smart-blocks';
import { CanvasPreview } from '@/components/canvas-preview';
import { ChatSidebar } from '@/components/chat-sidebar';
import { UploadDropzone } from '@/components/upload-dropzone';

export default function Page() {
  const sourceUrl = useEditorStore((s) => s.sourceUrl);

  return (
    <main className="grid h-screen w-screen grid-rows-[56px_1fr] bg-canvas">
      <header className="flex items-center justify-between px-6 border-b border-line bg-canvas/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sparkles className="size-3.5 text-accent" />
          </div>
          <div className="font-serif text-[17px] tracking-tight text-ink">
            Claude Video Editor
          </div>
        </div>
        <div className="text-[12px] text-muted">
          Describe edits in plain language
        </div>
      </header>

      <div className="grid grid-cols-[260px_1fr_400px] overflow-hidden">
        <aside className="border-r border-line bg-warm/40 flex flex-col overflow-hidden">
          <SmartBlocks />
        </aside>

        <section className="flex flex-col items-center justify-center p-8 overflow-hidden">
          {sourceUrl ? <CanvasPreview /> : <UploadDropzone />}
        </section>

        <aside className="border-l border-line bg-surface flex flex-col overflow-hidden">
          <ChatSidebar />
        </aside>
      </div>
    </main>
  );
}
