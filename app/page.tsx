'use client';

import { useEditorStore } from '@/lib/store';
import { SmartBlocks } from '@/components/smart-blocks';
import { CanvasPreview } from '@/components/canvas-preview';
import { ChatSidebar } from '@/components/chat-sidebar';
import { UploadDropzone } from '@/components/upload-dropzone';

export default function Page() {
  const sourceUrl = useEditorStore((s) => s.sourceUrl);

  return (
    <main className="grid h-screen w-screen grid-cols-[240px_1fr_380px] bg-bg">
      <aside className="border-r border-border bg-panel overflow-hidden flex flex-col">
        <header className="px-4 py-3 border-b border-border">
          <div className="text-[13px] font-medium text-neutral-200">Smart Blocks</div>
          <div className="text-[11px] text-neutral-500">Applied operations</div>
        </header>
        <SmartBlocks />
      </aside>

      <section className="flex flex-col items-center justify-center p-6 overflow-hidden">
        {sourceUrl ? <CanvasPreview /> : <UploadDropzone />}
      </section>

      <aside className="border-l border-border bg-panel flex flex-col overflow-hidden">
        <ChatSidebar />
      </aside>
    </main>
  );
}
