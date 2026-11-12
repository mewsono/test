import type { ArtRecipe } from '../data/library';
import { hexToRgb, rgbToHsl, hsl, vivify } from './color';
import { coverCanvas } from './cover';

export type Palette = {
  /** three colours pulled out of the sleeve, pushed to glow on near-black */
  blobs: [string, string, string];
  /** the liveliest one — used for progress, glow and active states */
  accent: string;
  /** a deep tone for washed-out fills */
  deep: string;
};

export const DEFAULT_PALETTE: Palette = {
  blobs: ['#FF6A4D', '#7C6CFF', '#FFC454'],
  accent: '#FF8C6E',
  deep: '#2A1F5C',
};

type Cluster = { r: number; g: number; b: number; n: number };

function kmeans(pixels: number[][], k: number, iters = 12): Cluster[] {
  if (pixels.length === 0) return [];
  // spread the seeds out along the sample list so we don't start clumped
  const centers: Cluster[] = [];
  for (let i = 0; i < k; i++) {
    const p = pixels[Math.floor((i / k) * pixels.length) % pixels.length];
    centers.push({ r: p[0], g: p[1], b: p[2], n: 0 });
  }
  for (let it = 0; it < iters; it++) {
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const p of pixels) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dr = p[0] - centers[c].r;
        const dg = p[1] - centers[c].g;
        const db = p[2] - centers[c].b;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      sums[best].r += p[0];
      sums[best].g += p[1];
      sums[best].b += p[2];
      sums[best].n++;
    }
    for (let c = 0; c < centers.length; c++) {
      const s = sums[c];
      if (s.n === 0) continue;
      centers[c] = { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n, n: s.n };
    }
  }
  return centers.filter((c) => c.n > 0);
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Sample the sleeve the way you'd hold it under a lamp: quantise the pixels,
 * keep what's plentiful and vivid, then lift the winners until they glow
 * against near-black.
 */
export function extractPalette(canvas: HTMLCanvasElement): Palette {
  const S = 48;
  const small = document.createElement('canvas');
  small.width = small.height = S;
  const sctx = small.getContext('2d', { willReadFrequently: true })!;
  sctx.drawImage(canvas, 0, 0, S, S);
  const { data } = sctx.getImageData(0, 0, S, S);

  const sample: number[][] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { l, s } = rgbToHsl({ r, g, b });
    // skip the soot and the glare
    if (l < 0.08 || l > 0.96) continue;
    if (s < 0.12 && l < 0.25) continue;
    sample.push([r, g, b]);
  }
  if (sample.length < 8) return DEFAULT_PALETTE;

  const clusters = kmeans(sample, 5);
  const scored = clusters.map((c) => {
    const { h, s, l } = rgbToHsl(c);
    // plenty of pixels, punchy, and not sitting in the mud
    const weight = Math.pow(c.n, 0.55) * (0.25 + s) * (0.55 + Math.min(l, 0.7) * 1.4);
    return { h, s, l, weight };
  });
  scored.sort((a, b) => b.weight - a.weight);

  const chosen: typeof scored = [];
  for (const c of scored) {
    if (chosen.every((o) => hueDistance(o.h, c.h) > 22 || Math.abs(o.l - c.l) > 0.24)) {
      chosen.push(c);
    }
    if (chosen.length === 3) break;
  }
  while (chosen.length < 3) {
    const base = chosen[chosen.length - 1] ?? { h: 20, s: 0.6, l: 0.55 };
    chosen.push({ ...base, h: (base.h + 118) % 360 });
  }

  const blobs = chosen.map((c, i) =>
    hsl(c.h, Math.max(0.5, Math.min(0.95, c.s + 0.08)), i === 0 ? 0.56 : 0.52 + i * 0.02),
  ) as [string, string, string];

  const liveliest = [...chosen].sort((a, b) => b.s * (0.6 + b.l) - a.s * (0.6 + a.l))[0];
  const accent = vivify(hsl(liveliest.h, Math.max(0.62, liveliest.s), 0.62), 0.6, 0.62);
  const deep = hsl(chosen[0].h, 0.45, 0.16);

  return { blobs, accent, deep };
}

const paletteCache = new Map<string, Palette>();

export function paletteFor(art: ArtRecipe): Palette {
  const key = `${art.a}|${art.b}|${art.ink}|${art.motif}|${art.angle}`;
  const hit = paletteCache.get(key);
  if (hit) return hit;
  let p: Palette;
  try {
    p = extractPalette(coverCanvas(art, 128));
  } catch {
    p = DEFAULT_PALETTE;
  }
  paletteCache.set(key, p);
  return p;
}

export function previewSwatch(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}
