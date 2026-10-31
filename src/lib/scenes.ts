/* Procedural cover art.

   Six scenes, each drawn from a palette. Everything is inline SVG so covers are
   crisp at any density, cost no network requests and keep working offline. */

import { PAL } from './palettes';
import type {
  BambooPalette,
  GatePalette,
  KoiPalette,
  PagodaPalette,
  SeaPalette,
  SnowPalette,
} from './palettes';

let uid = 0;

type Stop = [offset: number, color: string, opacity?: number];

function lin(id: string, stops: Stop[]): string {
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    stops
      .map(
        (s) =>
          `<stop offset="${s[0]}" stop-color="${s[1]}"` +
          (s[2] != null ? ` stop-opacity="${s[2]}"` : '') +
          '/>',
      )
      .join('') +
    `</linearGradient>`
  );
}

function rad(id: string, color: string, alpha: number): string {
  return (
    `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${alpha}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
  );
}

function svg(viewBox: string, inner: string): string {
  return `<svg class="art" aria-hidden="true" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
}

/** Torii gate over a still lake, lanterns strung across the sky. */
export function gate(p: GatePalette): string {
  const i = `g${++uid}`;

  const stars = [
    [40, 70, 1.1],
    [96, 40, 0.9],
    [150, 84, 1.2],
    [188, 48, 0.8],
    [360, 60, 1],
    [20, 124, 0.9],
    [120, 110, 0.8],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    .join('');

  const lamps = [
    [50, 174],
    [100, 179],
    [150, 174],
    [250, 145],
    [300, 142],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="22" fill="url(#${i}l)"/>` +
        `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" fill="${p.lamp}"/>`,
    )
    .join('');

  const petals = [
    [60, 300, 30],
    [330, 260, -20],
    [190, 330, 50],
    [270, 210, 10],
    [110, 240, -40],
    [360, 360, 35],
    [30, 380, -10],
  ]
    .map(
      ([x, y, a]) =>
        `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="2" transform="rotate(${a} ${x} ${y})"/>`,
    )
    .join('');

  const torii =
    `<rect x="150" y="196" width="14" height="154" fill="${p.torii}"/>` +
    `<rect x="236" y="196" width="14" height="154" fill="${p.torii}"/>` +
    `<rect x="136" y="240" width="128" height="9" fill="${p.torii}"/>` +
    `<path d="M112 196 Q200 220 288 196 L288 206 Q200 230 112 206 Z" fill="${p.torii}"/>` +
    `<path d="M100 184 Q200 214 300 184 L304 174 Q200 204 96 174 Z" fill="#1B1236"/>`;

  return svg(
    '0 0 400 500',
    `<defs>` +
      lin(`${i}s`, [
        [0, p.sky[0]],
        [0.42, p.sky[1]],
        [0.72, p.sky[2]],
        [1, p.sky[3]],
      ]) +
      rad(`${i}m`, p.moon, 0.7) +
      lin(`${i}w`, [
        [0, p.water[0]],
        [1, p.water[1]],
      ]) +
      rad(`${i}l`, p.lamp, 0.95) +
      lin(`${i}f`, [
        [0, p.sky[3], 0],
        [1, p.sky[3], 0.55],
      ]) +
      `<g id="${i}t">${torii}</g></defs>` +
      `<rect width="400" height="500" fill="url(#${i}s)"/>` +
      `<g fill="${p.moon}">${stars}</g>` +
      `<circle cx="248" cy="96" r="120" fill="url(#${i}m)"/><circle cx="248" cy="96" r="34" fill="${p.moon}"/>` +
      `<path d="M0 300 L60 240 L110 280 L170 220 L240 285 L300 235 L400 300 L400 350 L0 350Z" fill="${p.mtn[0]}" opacity=".65"/>` +
      `<path d="M0 330 L80 280 L140 320 L220 270 L310 325 L400 285 L400 360 L0 360Z" fill="${p.mtn[1]}"/>` +
      `<rect y="300" width="400" height="60" fill="url(#${i}f)"/>` +
      `<rect y="350" width="400" height="150" fill="url(#${i}w)"/>` +
      `<g fill="${p.moon}">` +
      `<rect x="226" y="362" width="44" height="3" rx="1.5" opacity=".5"/>` +
      `<rect x="234" y="374" width="30" height="3" rx="1.5" opacity=".4"/>` +
      `<rect x="222" y="388" width="52" height="3" rx="1.5" opacity=".3"/>` +
      `<rect x="236" y="404" width="26" height="3" rx="1.5" opacity=".22"/></g>` +
      `<use href="#${i}t"/><use href="#${i}t" transform="translate(0 700) scale(1 -1)" opacity=".28"/>` +
      `<path d="M0 150 Q100 190 200 150 Q300 110 400 160" fill="none" stroke="#1B1236" stroke-opacity=".6" stroke-width="1.2"/>` +
      lamps +
      `<path d="M0 420 Q70 392 150 432 L150 500 L0 500Z" fill="#0B0720"/>` +
      `<path d="M310 470 Q360 430 400 440 L400 500 L310 500Z" fill="#0B0720"/>` +
      `<g fill="${p.petal}" opacity=".85">${petals}</g>`,
  );
}

/** Pagoda on a hill, cherry or maple in front. */
export function pagoda(p: PagodaPalette): string {
  const i = `g${++uid}`;

  return svg(
    '0 0 140 220',
    `<defs>` +
      lin(`${i}s`, [
        [0, p.sky[0]],
        [0.5, p.sky[1]],
        [1, p.sky[2]],
      ]) +
      rad(`${i}u`, p.sun, 0.9) +
      lin(`${i}m`, [
        [0, p.mist, 0],
        [1, p.mist, 0.7],
      ]) +
      `</defs>` +
      `<rect width="140" height="220" fill="url(#${i}s)"/>` +
      `<circle cx="100" cy="74" r="46" fill="url(#${i}u)"/><circle cx="100" cy="74" r="20" fill="${p.sun}"/>` +
      `<path d="M0 120 L30 92 L52 108 L84 78 L120 104 L140 90 L140 150 L0 150Z" fill="${p.far}" opacity=".7"/>` +
      `<path d="M0 138 L40 112 L70 130 L110 106 L140 126 L140 160 L0 160Z" fill="${p.near}" opacity=".85"/>` +
      `<rect y="110" width="140" height="50" fill="url(#${i}m)"/>` +
      `<path d="M0 152 Q60 130 140 158 L140 220 L0 220Z" fill="${p.hill}"/>` +
      `<g fill="${p.pag}">` +
      `<rect x="34" y="134" width="44" height="8"/><rect x="42" y="116" width="28" height="18"/>` +
      `<path d="M24 118 Q44 114 56 96 Q68 114 88 118 Z"/><rect x="47" y="88" width="18" height="10"/>` +
      `<path d="M32 92 Q46 88 56 74 Q66 88 80 92 Z"/><rect x="49" y="66" width="14" height="10"/>` +
      `<path d="M40 70 Q50 66 56 54 Q62 66 72 70 Z"/><rect x="55.2" y="40" width="1.6" height="16"/></g>` +
      `<circle cx="14" cy="176" r="26" fill="${p.fol[0]}"/><circle cx="40" cy="192" r="22" fill="${p.fol[1]}"/>` +
      `<circle cx="130" cy="180" r="28" fill="${p.fol[0]}"/><circle cx="108" cy="202" r="24" fill="${p.fol[2]}"/>` +
      `<g fill="${p.blossom}">` +
      `<circle cx="20" cy="166" r="3"/><circle cx="34" cy="180" r="2.4"/>` +
      `<circle cx="124" cy="168" r="3"/><circle cx="136" cy="184" r="2.4"/></g>`,
  );
}

function koiShape(c: string[]): string {
  return (
    `<path d="M-18 0 Q-30 -9 -36 -5 Q-31 0 -36 6 Q-30 9 -18 0Z" fill="${c[2]}"/>` +
    `<ellipse rx="20" ry="7" fill="${c[0]}"/><ellipse cx="-4" rx="8" ry="5" fill="${c[1]}"/>` +
    `<path d="M2 5 Q6 14 -4 12Z" fill="${c[2]}"/><circle cx="15" cy="-2" r="1.2" fill="#1A1048"/>`
  );
}

/** Two koi circling under lotus pads. */
export function koi(p: KoiPalette): string {
  const i = `g${++uid}`;

  return svg(
    '0 0 140 220',
    `<defs>` +
      lin(`${i}b`, [
        [0, p.bg[0]],
        [0.55, p.bg[1]],
        [1, p.bg[2]],
      ]) +
      rad(`${i}l`, p.light, 0.5) +
      `</defs>` +
      `<rect width="140" height="220" fill="url(#${i}b)"/><circle cx="40" cy="40" r="70" fill="url(#${i}l)"/>` +
      `<g fill="none" stroke="${p.light}">` +
      `<circle cx="96" cy="64" r="14" stroke-opacity=".4"/>` +
      `<circle cx="96" cy="64" r="26" stroke-opacity=".24"/>` +
      `<circle cx="96" cy="64" r="38" stroke-opacity=".12"/></g>` +
      `<ellipse cx="30" cy="154" rx="24" ry="14" fill="${p.pad[0]}"/>` +
      `<ellipse cx="110" cy="178" rx="28" ry="16" fill="${p.pad[1]}"/>` +
      `<ellipse cx="66" cy="200" rx="20" ry="10" fill="${p.pad[2]}"/>` +
      `<circle cx="110" cy="174" r="8" fill="${p.flower[0]}"/><circle cx="110" cy="174" r="4" fill="${p.flower[1]}"/>` +
      `<g transform="translate(62 98) rotate(-28)">${koiShape(p.k1)}</g>` +
      `<g transform="translate(96 134) rotate(155) scale(.8)">${koiShape(p.k2)}</g>`,
  );
}

/** Snowy shrine at night, lantern lit. */
export function snow(p: SnowPalette): string {
  const i = `g${++uid}`;

  const flakes = [
    [20, 30],
    [52, 58],
    [88, 24],
    [120, 80],
    [30, 96],
    [74, 84],
    [108, 116],
    [14, 130],
    [64, 170],
    [92, 190],
    [30, 200],
  ]
    .map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${1 + (k % 3) * 0.18}"/>`)
    .join('');

  return svg(
    '0 0 140 220',
    `<defs>` +
      lin(`${i}s`, [
        [0, p.sky[0]],
        [0.5, p.sky[1]],
        [0.78, p.sky[2]],
      ]) +
      lin(`${i}g`, [
        [0, p.snow[0]],
        [1, p.snow[1]],
      ]) +
      rad(`${i}l`, '#FFC46B', 0.9) +
      `</defs>` +
      `<rect width="140" height="220" fill="url(#${i}s)"/>` +
      `<circle cx="104" cy="46" r="10" fill="${p.moon}"/>` +
      `<path d="M0 152 L14 106 L28 152Z M20 152 L38 96 L56 152Z M100 152 L116 110 L132 152Z" fill="${p.pine}" opacity=".8"/>` +
      `<path d="M0 150 Q70 138 140 152 L140 220 L0 220Z" fill="url(#${i}g)"/>` +
      `<rect x="38" y="150" width="60" height="6" fill="#8794C9"/>` +
      `<rect x="56" y="128" width="24" height="22" fill="#FFC46B" opacity=".9"/>` +
      `<rect x="46" y="118" width="5" height="34" fill="#D2452F"/>` +
      `<rect x="85" y="118" width="5" height="34" fill="#D2452F"/>` +
      `<rect x="42" y="112" width="52" height="7" fill="#D2452F"/>` +
      `<path d="M30 112 Q60 108 68 92 Q76 108 106 112 Z" fill="#1E2350"/>` +
      `<circle cx="113" cy="145" r="22" fill="url(#${i}l)"/>` +
      `<rect x="111" y="150" width="4" height="14" fill="#6D79B0"/>` +
      `<rect x="107" y="140" width="12" height="10" fill="#FFC46B"/>` +
      `<path d="M104 140 L113 132 L122 140Z" fill="#4A5590"/>` +
      `<g fill="#FFFFFF" opacity=".85">${flakes}</g>`,
  );
}

/** Lone pine on a cliff over the sea at sunset. */
export function sea(p: SeaPalette): string {
  const i = `g${++uid}`;

  return svg(
    '0 0 140 220',
    `<defs>` +
      lin(`${i}s`, [
        [0, p.sky[0]],
        [0.6, p.sky[1]],
        [1, p.sky[2]],
      ]) +
      lin(`${i}w`, [
        [0, p.sea[0]],
        [1, p.sea[1]],
      ]) +
      rad(`${i}u`, p.sun, 0.7) +
      `</defs>` +
      `<rect width="140" height="132" fill="url(#${i}s)"/>` +
      `<circle cx="56" cy="126" r="72" fill="url(#${i}u)"/><circle cx="56" cy="126" r="32" fill="${p.sun}"/>` +
      `<rect y="130" width="140" height="90" fill="url(#${i}w)"/>` +
      `<g fill="${p.sun}">` +
      `<rect x="36" y="138" width="40" height="2.5" rx="1.2" opacity=".6"/>` +
      `<rect x="42" y="148" width="28" height="2.5" rx="1.2" opacity=".45"/>` +
      `<rect x="38" y="160" width="36" height="2.5" rx="1.2" opacity=".32"/>` +
      `<rect x="46" y="174" width="18" height="2.5" rx="1.2" opacity=".22"/></g>` +
      `<g fill="${p.cliff}">` +
      `<path d="M140 74 Q122 70 108 92 Q98 108 84 128 L72 150 L72 220 L140 220 Z"/>` +
      `<rect x="122" y="46" width="3" height="28"/>` +
      `<ellipse cx="124" cy="44" rx="14" ry="4.5"/>` +
      `<ellipse cx="118" cy="36" rx="10" ry="3.6"/>` +
      `<ellipse cx="129" cy="32" rx="8" ry="3.2"/></g>` +
      `<g fill="none" stroke="${p.cliff}" stroke-width="1.2" stroke-linecap="round" opacity=".7">` +
      `<path d="M22 50 q4 -5 8 0 q4 -5 8 0"/><path d="M44 38 q3 -4 6 0 q3 -4 6 0"/></g>`,
  );
}

/** Bamboo grove with the moon behind it. */
export function bamboo(p: BambooPalette): string {
  const i = `g${++uid}`;
  let back = '';
  let front = '';
  let leaves = '';

  [14, 40, 66, 92, 120].forEach((x, k) => {
    back += `<rect x="${x}" y="0" width="5" height="220" fill="${p.back}" opacity=".55"/>`;
    [34, 84, 134, 184].forEach((y) => {
      back += `<rect x="${x - 0.5}" y="${y + k * 3}" width="6" height="1.4" fill="${p.node}" opacity=".6"/>`;
    });
  });

  [6, 30, 56, 84, 108, 130].forEach((x, k) => {
    front += `<rect x="${x}" y="0" width="7" height="220" fill="${p.front}"/>`;
    front += `<rect x="${x + 4.5}" y="0" width="2.5" height="220" fill="${p.node}" opacity=".35"/>`;
    [28, 70, 112, 154, 196].forEach((y) => {
      front += `<rect x="${x - 0.7}" y="${y + ((k * 4) % 12)}" width="8.4" height="2" fill="${p.node}"/>`;
    });
  });

  [
    [40, 60, -30],
    [56, 100, 25],
    [84, 40, -20],
    [108, 130, 30],
    [30, 150, -35],
    [130, 90, 20],
    [70, 170, -25],
  ].forEach(([x, y, a]) => {
    leaves +=
      `<g transform="translate(${x} ${y}) rotate(${a})">` +
      `<ellipse cx="9" rx="9" ry="2.2"/>` +
      `<ellipse cx="-9" cy="-3" rx="8" ry="2" transform="rotate(-24)"/>` +
      `<ellipse cx="6" cy="5" rx="7" ry="1.8" transform="rotate(20)"/></g>`;
  });

  return svg(
    '0 0 140 220',
    `<defs>` +
      lin(`${i}b`, [
        [0, p.bg[0]],
        [0.5, p.bg[1]],
        [1, p.bg[2]],
      ]) +
      rad(`${i}m`, p.moon, 0.55) +
      lin(`${i}f`, [
        [0, p.moon, 0],
        [1, p.moon, 0.25],
      ]) +
      `</defs>` +
      `<rect width="140" height="220" fill="url(#${i}b)"/>` +
      `<circle cx="98" cy="56" r="64" fill="url(#${i}m)"/><circle cx="98" cy="56" r="22" fill="${p.moon}"/>` +
      back +
      `<rect y="120" width="140" height="100" fill="url(#${i}f)"/>` +
      front +
      `<g fill="${p.leaf}">${leaves}</g>`,
  );
}

export const SCENES = { gate, pagoda, koi, snow, sea, bamboo };

/** The profile banner reuses the gate scene. */
export const bannerArt = (): string => gate(PAL.gate.dawn);
