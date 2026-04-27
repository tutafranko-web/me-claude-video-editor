import type { Operation } from '@/types/editor';

export function buildArgs(
  ops: Operation[],
  inputName: string,
  outputName: string,
): string[] {
  const args: string[] = [];

  const trim = ops.find((o) => o.kind === 'trim') as
    | Extract<Operation, { kind: 'trim' }>
    | undefined;
  if (trim) {
    args.push('-ss', String(trim.startSec));
    args.push('-t', String(Math.max(0.1, trim.endSec - trim.startSec)));
  }

  args.push('-i', inputName);

  const vfParts: string[] = [];
  const afParts: string[] = [];

  for (const op of ops) {
    if (op.kind === 'filter') {
      if (op.filter === 'grayscale') {
        vfParts.push('format=gray');
      } else if (op.filter === 'brightness') {
        vfParts.push(`eq=brightness=${(op.value ?? 0.2).toFixed(2)}`);
      } else if (op.filter === 'contrast') {
        vfParts.push(`eq=contrast=${(1 + (op.value ?? 0.3)).toFixed(2)}`);
      }
    } else if (op.kind === 'speed') {
      const mult = op.multiplier;
      vfParts.push(`setpts=PTS/${mult}`);
      if (mult >= 0.5 && mult <= 100) {
        afParts.push(`atempo=${mult}`);
      }
    } else if (op.kind === 'crop') {
      vfParts.push(`crop=${op.w}:${op.h}:${op.x}:${op.y}`);
    }
  }

  if (vfParts.length) args.push('-vf', vfParts.join(','));
  if (afParts.length) args.push('-af', afParts.join(','));

  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y',
    outputName,
  );

  return args;
}
