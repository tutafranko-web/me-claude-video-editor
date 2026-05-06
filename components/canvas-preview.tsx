'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { buildArgs } from '@/lib/ffmpeg-commands';
import { formatTime } from '@/lib/utils';
import type { WorkerOutbound } from '@/types/editor';

export function CanvasPreview() {
  const sourceFile = useEditorStore((s) => s.sourceFile);
  const sourceUrl = useEditorStore((s) => s.sourceUrl);
  const previewUrl = useEditorStore((s) => s.previewUrl);
  const operations = useEditorStore((s) => s.operations);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const progress = useEditorStore((s) => s.progress);
  const error = useEditorStore((s) => s.error);
  const setProcessing = useEditorStore((s) => s.setProcessing);
  const setProgress = useEditorStore((s) => s.setProgress);
  const setPreviewUrl = useEditorStore((s) => s.setPreviewUrl);
  const setError = useEditorStore((s) => s.setError);
  const setSource = useEditorStore((s) => s.setSource);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number | null>(null);
  const opsKeyRef = useRef<string>('');
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const w = new Worker(new URL('../workers/ffmpeg.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = w;
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sourceFile || !workerRef.current) return;

    const key = JSON.stringify(operations);
    if (key === opsKeyRef.current) return;
    opsKeyRef.current = key;

    if (operations.length === 0) {
      setPreviewUrl(sourceUrl);
      setError(null);
      return;
    }

    let cancelled = false;
    setProcessing(true);
    setProgress(0);
    setError(null);

    const onMessage = (e: MessageEvent<WorkerOutbound>) => {
      if (cancelled) return;
      const data = e.data;
      if (data.type === 'progress') {
        setProgress(data.ratio);
      } else if (data.type === 'done') {
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setProcessing(false);
        setProgress(1);
        workerRef.current?.removeEventListener('message', onMessage);
      } else if (data.type === 'error') {
        setError(data.message);
        setProcessing(false);
        workerRef.current?.removeEventListener('message', onMessage);
      }
    };
    workerRef.current.addEventListener('message', onMessage);

    sourceFile
      .arrayBuffer()
      .then((buf) => {
        if (cancelled) return;
        const args = buildArgs(operations, 'input.mp4', 'output.mp4');
        workerRef.current?.postMessage(
          {
            type: 'process',
            fileBuffer: buf,
            fileName: 'input.mp4',
            args,
            outputName: 'output.mp4',
          },
          [buf],
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setProcessing(false);
        }
      });

    return () => {
      cancelled = true;
      workerRef.current?.removeEventListener('message', onMessage);
    };
  }, [operations, sourceFile, sourceUrl, setProcessing, setProgress, setPreviewUrl, setError]);

  useEffect(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      if (v.readyState >= 2 && v.videoWidth) {
        if (c.width !== v.videoWidth) c.width = v.videoWidth;
        if (c.height !== v.videoHeight) c.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, c.width, c.height);
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    const onLoaded = () => {
      setDuration(v.duration || 0);
      drawFrame();
    };
    const onTime = () => setTime(v.currentTime);
    const onEnd = () => setPlaying(false);

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnd);

    if (v.readyState >= 2) onLoaded();

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [previewUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = parseFloat(e.target.value);
    setTime(v.currentTime);
  };

  const onReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith('video/')) setSource(f);
  };

  return (
    <div className="w-full max-w-[920px] flex flex-col gap-4">
      <div className="relative w-full aspect-video bg-ink rounded-3xl overflow-hidden shadow-card border border-line">
        <video
          ref={videoRef}
          src={previewUrl ?? undefined}
          className="hidden"
          playsInline
        />
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        {isProcessing && (
          <div className="absolute inset-0 bg-canvas/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="size-10 rounded-full bg-accent/15 flex items-center justify-center animate-pulse-soft">
              <div className="size-3 rounded-full bg-accent" />
            </div>
            <div className="text-[13px] text-ink font-medium">Rendering…</div>
            <div className="w-56 h-1 rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-surface border border-accent/30 text-ink text-[12.5px] px-4 py-3 shadow-card">
            <div className="font-medium text-accentDeep mb-0.5">Couldn't render</div>
            <div className="text-muted">{error}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <button
          onClick={togglePlay}
          className="size-9 rounded-full bg-ink text-canvas hover:bg-ink/85 flex items-center justify-center transition shadow-soft"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-[1px]" />}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={time}
          onChange={onSeek}
          className="flex-1"
        />
        <div className="text-[12px] text-muted tabular-nums w-24 text-right">
          {formatTime(time)} / {formatTime(duration)}
        </div>
        <button
          onClick={() => replaceInputRef.current?.click()}
          className="ml-2 flex items-center gap-1.5 text-[12px] text-muted hover:text-ink rounded-full px-3 py-1.5 hover:bg-warm transition"
          aria-label="Replace video"
          title="Replace video"
        >
          <RotateCcw className="size-3" />
          Replace
        </button>
        <input
          ref={replaceInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={onReplace}
        />
      </div>
    </div>
  );
}
