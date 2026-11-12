import type { ArtRecipe } from '../data/library';
import { withAlpha } from './color';

/**
 * yuri cut every sleeve in the shop by hand — the artwork here is drawn on a
 * canvas at load time, which means it stays crisp at any size and the player
 * can sample its colours back out for the room lighting.
 */

let noise: HTMLCanvasElement | null = null;

function noiseTile(): HTMLCanvasElement {
  if (noise) return noise;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d')!;
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 140 + Math.random() * 115;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  g.putImageData(img, 0, 0);
  noise = c;
  return c;
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  S: number,
  art: ArtRecipe,
  ink: string,
) {
  ctx.save();
  switch (art.motif) {
    case 'disc': {
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.arc(S * 0.79, S * 0.21, S * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#0E0A15';
      ctx.beginPath();
      ctx.arc(S * 0.79, S * 0.21, S * 0.11, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'arc': {
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = S * 0.17;
      ctx.beginPath();
      ctx.arc(S * 0.15, S * 0.9, S * 0.62, -Math.PI * 0.55, Math.PI * 0.05);
      ctx.stroke();
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = S * 0.02;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(S * 0.15, S * 0.9, S * (0.7 + i * 0.1), -Math.PI * 0.5, Math.PI * 0.1);
        ctx.stroke();
      }
      break;
    }
    case 'bars': {
      ctx.fillStyle = ink;
      const widths = [0.055, 0.12, 0.03, 0.09, 0.045, 0.16, 0.065];
      let x = S * 0.08;
      widths.forEach((w, i) => {
        ctx.globalAlpha = 0.2 + i * 0.1;
        ctx.fillRect(x, S * 0.16, S * w, S * 0.68);
        x += S * (w + 0.045);
      });
      break;
    }
    case 'sun': {
      for (let i = 6; i >= 1; i--) {
        ctx.globalAlpha = i % 2 === 0 ? 0.16 : 0.34;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(S * 0.5, S * 0.46, S * (0.06 + i * 0.062), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'grid': {
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = Math.max(1, S * 0.007);
      for (let i = 1; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(S * 0.1, S * (0.1 + i * 0.12));
        ctx.lineTo(S * 0.9, S * (0.1 + i * 0.12));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(S * (0.1 + i * 0.12), S * 0.1);
        ctx.lineTo(S * (0.1 + i * 0.12), S * 0.9);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = ink;
      ctx.beginPath();
      const r = S * 0.12;
      const x = S * 0.34;
      const y = S * 0.22;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + r * 2, y, x + r * 2, y + r, r);
      ctx.arcTo(x + r * 2, y + r * 2, x, y + r * 2, r);
      ctx.arcTo(x, y + r * 2, x, y, r);
      ctx.arcTo(x, y, x + r * 2, y, r);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'wave': {
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1.5, S * 0.016);
      for (let i = 0; i < 7; i++) {
        ctx.globalAlpha = 0.14 + i * 0.1;
        const y = S * (0.24 + i * 0.078);
        ctx.beginPath();
        for (let x = 0; x <= S; x += S / 48) {
          const yy = y + Math.sin((x / S) * Math.PI * 3.1 + i * 0.7) * S * 0.045;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      break;
    }
    case 'orb': {
      const g = ctx.createRadialGradient(
        S * 0.42,
        S * 0.34,
        S * 0.02,
        S * 0.55,
        S * 0.5,
        S * 0.52,
      );
      g.addColorStop(0, withAlpha(ink, 0.95));
      g.addColorStop(0.55, withAlpha(ink, 0.45));
      g.addColorStop(1, withAlpha(ink, 0.05));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(S * 0.5, S * 0.5, S * 0.46, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

export function drawCover(ctx: CanvasRenderingContext2D, S: number, art: ArtRecipe) {
  const ang = (art.angle * Math.PI) / 180;
  const cx = S / 2;
  const cy = S / 2;
  const dx = Math.cos(ang) * cx;
  const dy = Math.sin(ang) * cy;
  const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  grad.addColorStop(0, art.a);
  grad.addColorStop(1, art.b);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // a soft bloom so the flat gradient has some depth
  const bloom = ctx.createRadialGradient(S * 0.18, S * 0.06, 0, S * 0.18, S * 0.06, S * 0.9);
  bloom.addColorStop(0, 'rgba(255,255,255,.28)');
  bloom.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, S, S);

  drawMotif(ctx, S, art, art.ink);

  // the shop's signature: an open ring, bottom left
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.82)';
  ctx.lineWidth = Math.max(1, S * 0.03);
  ctx.beginPath();
  ctx.arc(S * 0.2, S * 0.79, S * 0.135, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // grain + vignette, so it reads as printed card rather than a gradient
  ctx.save();
  ctx.globalAlpha = 0.5;
  const pat = ctx.createPattern(noiseTile(), 'repeat');
  if (pat) {
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, S, S);
  }
  ctx.restore();

  const vig = ctx.createRadialGradient(cx, cy, S * 0.28, cx, cy, S * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(8,5,13,.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, S, S);
}

const cache = new Map<string, HTMLCanvasElement>();

/** the canonical rendered sleeve, cached per recipe + size */
export function coverCanvas(art: ArtRecipe, size = 384): HTMLCanvasElement {
  const key = `${art.a}|${art.b}|${art.ink}|${art.motif}|${art.angle}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  drawCover(ctx, size, art);
  cache.set(key, c);
  return c;
}

const urls = new Map<string, string>();

export function coverUrl(art: ArtRecipe, size = 384): string {
  const key = `${art.a}|${art.b}|${art.ink}|${art.motif}|${art.angle}|${size}`;
  const hit = urls.get(key);
  if (hit) return hit;
  const url = coverCanvas(art, size).toDataURL('image/jpeg', 0.9);
  urls.set(key, url);
  return url;
}
