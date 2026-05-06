'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, Sparkles, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { parsePrompt, describeOperation } from '@/lib/prompt-parser';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Trim first 5 seconds',
  'Make it black and white',
  'Speed up 2×',
  'Increase brightness',
];

export function ChatSidebar() {
  const messages = useEditorStore((s) => s.messages);
  const sourceFile = useEditorStore((s) => s.sourceFile);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const pushMessage = useEditorStore((s) => s.pushMessage);
  const addOperation = useEditorStore((s) => s.addOperation);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const submit = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setText('');

    if (!sourceFile) {
      pushMessage({ role: 'user', text: t });
      pushMessage({
        role: 'assistant',
        text: 'Drop a video first, then describe the edit you want.',
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
    pushMessage({ role: 'assistant', text: `Applying ${describeOperation(result.op).toLowerCase()}.` });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(text);
  };

  return (
    <>
      <header className="px-5 py-4 border-b border-line flex items-center gap-2.5">
        <div className="size-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <Sparkles className="size-3.5 text-accent" />
        </div>
        <div>
          <div className="text-[13px] font-medium text-ink">AI Editor</div>
          <div className="text-[11px] text-muted">Plain language → edits</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 pt-8">
            <div className="size-12 rounded-2xl bg-accentSoft flex items-center justify-center">
              <Sparkles className="size-5 text-accent" />
            </div>
            <div className="space-y-1.5 max-w-[260px]">
              <div className="font-serif text-[18px] text-ink leading-tight">
                Tell me what to change
              </div>
              <div className="text-[13px] text-muted leading-relaxed">
                Drop a video, then describe the edit. I'll apply it instantly.
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[88%] text-[13.5px] leading-relaxed whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'rounded-2xl rounded-br-md bg-warm text-ink px-3.5 py-2.5'
                    : 'text-ink',
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Loader2 className="size-3.5 animate-spin text-accent" />
            <span>Rendering preview…</span>
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="text-[12px] text-ink bg-warm hover:bg-accentSoft border border-line hover:border-accent/30 rounded-full px-3 py-1.5 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="border-t border-line p-4">
        <div className="flex items-end gap-2 rounded-2xl bg-warm/60 border border-line focus-within:border-accent/40 focus-within:bg-surface px-3.5 py-2.5 transition shadow-soft">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(text);
              }
            }}
            rows={1}
            placeholder="Describe an edit…"
            className="flex-1 bg-transparent resize-none outline-none text-[13.5px] text-ink placeholder:text-faint max-h-32 leading-relaxed"
          />
          <button
            type="submit"
            disabled={!text.trim() || isProcessing}
            className={cn(
              'size-7 rounded-full flex items-center justify-center transition shrink-0',
              text.trim() && !isProcessing
                ? 'bg-accent hover:bg-accentDeep text-white'
                : 'bg-line text-faint cursor-not-allowed',
            )}
            aria-label="Send"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
        <div className="text-[10.5px] text-faint mt-2 px-1">
          Press <kbd className="px-1 rounded bg-warm border border-line text-[10px] text-muted">Enter</kbd> to send · <kbd className="px-1 rounded bg-warm border border-line text-[10px] text-muted">Shift</kbd>+<kbd className="px-1 rounded bg-warm border border-line text-[10px] text-muted">Enter</kbd> for newline
        </div>
      </form>
    </>
  );
}
