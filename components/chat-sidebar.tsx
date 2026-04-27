'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { parsePrompt, describeOperation } from '@/lib/prompt-parser';
import { cn } from '@/lib/utils';

export function ChatSidebar() {
  const messages = useEditorStore((s) => s.messages);
  const sourceFile = useEditorStore((s) => s.sourceFile);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const pushMessage = useEditorStore((s) => s.pushMessage);
  const addOperation = useEditorStore((s) => s.addOperation);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');

    if (!sourceFile) {
      pushMessage({ role: 'user', text: t });
      pushMessage({
        role: 'assistant',
        text: 'Upload a video first, then describe the edit.',
      });
      return;
    }

    pushMessage({ role: 'user', text: t });
    const result = parsePrompt(t);
    if (!result.ok) {
      pushMessage({ role: 'assistant', text: result.error });
      return;
    }
    addOperation(result.op);
    pushMessage({ role: 'assistant', text: `Applying: ${describeOperation(result.op)}` });
  };

  return (
    <>
      <header className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="size-4 text-accent" />
        <div>
          <div className="text-[13px] font-medium text-neutral-200">AI Editor</div>
          <div className="text-[11px] text-neutral-500">Describe edits in plain language</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-[12px] text-neutral-600 text-center py-12">
            Upload a video to start.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] text-[13px] leading-relaxed whitespace-pre-wrap',
                m.role === 'user'
                  ? 'rounded-2xl rounded-br-sm bg-neutral-800 px-3 py-2 text-neutral-100'
                  : 'text-neutral-300',
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="text-[12px] text-neutral-500 italic">Processing…</div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl bg-bg border border-border focus-within:border-neutral-600 px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as unknown as FormEvent);
              }
            }}
            rows={1}
            placeholder='e.g. "trim first 5 seconds"'
            className="flex-1 bg-transparent resize-none outline-none text-[13px] placeholder:text-neutral-600 max-h-32"
          />
          <button
            type="submit"
            disabled={!text.trim() || isProcessing}
            className="size-7 rounded-md bg-accent text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition"
            aria-label="Send"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <div className="text-[10px] text-neutral-600 mt-2 px-1">
          Try: trim first 5s · grayscale · speed up 2x · brightness
        </div>
      </form>
    </>
  );
}
