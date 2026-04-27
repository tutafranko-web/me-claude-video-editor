'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number | null>(null);
  const opsKeyRef = useRef<string>('');

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

  return (
    <div className="w-full max-w-[960px] flex flex-col gap-3">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border">
        <video
          ref={videoRef}
          src={previewUrl ?? undefined}
          className="hidden"
          playsInline
          muted={false}
          crossOrigin="anonymous"
        />
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        {isProcessing && (
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="text-[13px] text-neutral-300">Processing…</div>
            <div className="w-48 h-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-3 left-3 right-3 rounded-md bg-red-950/80 border border-red-900 text-red-200 text-[12px] px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <button
          onClick={togglePlay}
          className="size-8 rounded-md bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={time}
          onChange={onSeek}
          className="flex-1 accent-accent"
        />
        <div className="text-[12px] text-neutral-500 tabular-nums w-20 text-right">
          {formatTime(time)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
