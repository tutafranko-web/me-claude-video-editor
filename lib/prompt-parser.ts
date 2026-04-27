import type { Operation } from '@/types/editor';

type ParseResult =
  | { ok: true; op: Omit<Operation, 'id'> }
  | { ok: false; error: string };

const NUMBER = '(\\d+(?:[.,]\\d+)?)';

function num(s: string): number {
  return parseFloat(s.replace(',', '.'));
}

export function parsePrompt(input: string): ParseResult {
  const t = input.trim().toLowerCase();
  if (!t) return { ok: false, error: 'Empty prompt.' };

  // TRIM — "from X to Y" / "od X do Y"
  let m = t.match(
    new RegExp(
      `(?:cut|trim|izre[zž]i|skrati)\\s+(?:from|od)\\s+${NUMBER}\\s*s?\\s+(?:to|do)\\s+${NUMBER}\\s*s?`,
    ),
  );
  if (m) {
    return { ok: true, op: { kind: 'trim', startSec: num(m[1]), endSec: num(m[2]) } };
  }

  // TRIM — "first/prvih X seconds"
  m = t.match(
    new RegExp(
      `(?:cut|trim|izre[zž]i|skrati|keep)\\s+(?:the\\s+)?(?:first|prvih|prvi)\\s+${NUMBER}\\s*(?:s|sec|seconds|sekund[iae]?)`,
    ),
  );
  if (m) {
    return { ok: true, op: { kind: 'trim', startSec: 0, endSec: num(m[1]) } };
  }

  // FILTER — grayscale / black and white / crno-bijeli
  if (
    /\b(grayscale|greyscale|black\s*(?:and|&)?\s*white|b\s*&\s*w|bw|crno[-\s]?bije(?:li|lo))\b/.test(
      t,
    )
  ) {
    return { ok: true, op: { kind: 'filter', filter: 'grayscale' } };
  }

  // FILTER — brightness (with optional value)
  m = t.match(
    new RegExp(
      `(?:increase|raise|pojačaj|povisi|smanji|decrease|lower)?\\s*(?:brightness|svjetlin[ua])(?:\\s+(?:by|za)\\s+${NUMBER})?`,
    ),
  );
  if (m) {
    const decrease = /(smanji|decrease|lower)/.test(t);
    const value = m[1] ? num(m[1]) : 0.2;
    return {
      ok: true,
      op: { kind: 'filter', filter: 'brightness', value: decrease ? -value : value },
    };
  }

  // FILTER — contrast
  m = t.match(
    new RegExp(
      `(?:increase|raise|pojačaj|povisi)?\\s*(?:contrast|kontrast)(?:\\s+(?:by|za)\\s+${NUMBER})?`,
    ),
  );
  if (m) {
    const value = m[1] ? num(m[1]) : 0.3;
    return { ok: true, op: { kind: 'filter', filter: 'contrast', value } };
  }

  // SPEED — "Nx" / "by half" / "na pola"
  if (/\b(half|pola|polovic[ae])\b/.test(t) && /(slow|uspori)/.test(t)) {
    return { ok: true, op: { kind: 'speed', multiplier: 0.5 } };
  }
  if (/(double|dvostruko)/.test(t) && /(speed|ubrzaj)/.test(t)) {
    return { ok: true, op: { kind: 'speed', multiplier: 2 } };
  }
  m = t.match(
    new RegExp(`(?:speed\\s*up|ubrzaj|uspori|slow\\s*down)\\s+${NUMBER}\\s*x?`),
  );
  if (m) {
    const slow = /(slow|uspori)/.test(t);
    const v = num(m[1]);
    return { ok: true, op: { kind: 'speed', multiplier: slow ? 1 / v : v } };
  }

  return {
    ok: false,
    error:
      "I don't understand that command. Try: \"trim first 5 seconds\", \"grayscale\", \"speed up 2x\", \"increase brightness\", \"cut from 2s to 8s\".",
  };
}

export function describeOperation(op: Omit<Operation, 'id'>): string {
  switch (op.kind) {
    case 'trim':
      return `Trim ${op.startSec}s → ${op.endSec}s`;
    case 'filter':
      if (op.filter === 'grayscale') return 'Filter: Grayscale';
      if (op.filter === 'brightness')
        return `Filter: Brightness ${op.value && op.value > 0 ? '+' : ''}${op.value ?? 0}`;
      if (op.filter === 'contrast') return `Filter: Contrast +${op.value ?? 0}`;
      return 'Filter';
    case 'speed':
      return `Speed ${op.multiplier}x`;
    case 'crop':
      return `Crop ${op.w}×${op.h}`;
  }
}
