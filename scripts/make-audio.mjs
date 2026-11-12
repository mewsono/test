/**
 * yuri — audio forge
 *
 * Generates the record collection for the player: original, instrumental
 * pieces rendered from scratch (no samples, no downloads), then encoded to
 * MP3 with lamejs.
 *
 *   node scripts/make-audio.mjs            # render everything
 *   node scripts/make-audio.mjs --only=m1  # render one track
 *
 * Writes public/audio/<id>.mp3 and src/data/audio-meta.json
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SR = 44100;
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ *
 * tiny helpers
 * ------------------------------------------------------------------ */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** equal-power pan, pan in [-1, 1] */
function panGains(pan) {
  const a = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(a), Math.sin(a)];
}

/* ------------------------------------------------------------------ *
 * reverb — Schroeder: 4 damped combs into 2 allpasses, per channel
 * ------------------------------------------------------------------ */

function makeReverb(seconds, decay = 0.82) {
  const combs = [1116, 1188, 1277, 1356].map((d) => Math.round((d * SR) / 44100));
  const allpasses = [556, 441, 341].map((d) => Math.round((d * SR) / 44100));
  return { combs, allpasses, decay, spread: seconds };
}

function reverbChannel(input, rev, offset) {
  const n = input.length;
  const out = new Float32Array(n);
  const combBufs = rev.combs.map((len) => new Float32Array(len + offset));
  const combIdx = new Array(rev.combs.length).fill(0);
  const dampState = new Array(rev.combs.length).fill(0);
  const apBufs = rev.allpasses.map((len) => new Float32Array(len + offset));
  const apIdx = new Array(rev.allpasses.length).fill(0);

  for (let i = 0; i < n; i++) {
    const x = input[i];
    let y = 0;
    for (let c = 0; c < rev.combs.length; c++) {
      const buf = combBufs[c];
      const idx = combIdx[c];
      const del = buf[idx];
      // damping lowpass inside the loop keeps the tail dark, tape-like
      dampState[c] = del * 0.72 + dampState[c] * 0.28;
      buf[idx] = x * 0.25 + dampState[c] * rev.decay;
      combIdx[c] = idx + 1 === buf.length ? 0 : idx + 1;
      y += del;
    }
    y *= 0.25;

    for (let a = 0; a < rev.allpasses.length; a++) {
      const buf = apBufs[a];
      const idx = apIdx[a];
      const del = buf[idx];
      const v = y + del * -0.5;
      buf[idx] = v;
      apIdx[a] = idx + 1 === buf.length ? 0 : idx + 1;
      y = del + v * 0.5;
    }
    out[i] = y;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * the voice bank
 * each voice renders mono into `sc` then mixes into a bus
 * ------------------------------------------------------------------ */

const MAX_NOTE = Math.floor(SR * 8);
const scA = new Float32Array(MAX_NOTE);
const scB = new Float32Array(MAX_NOTE);

class Studio {
  constructor(seconds, seed) {
    this.n = Math.ceil(seconds * SR);
    this.dry = [new Float32Array(this.n), new Float32Array(this.n)];
    this.rev = [new Float32Array(this.n), new Float32Array(this.n)];
    this.dly = [new Float32Array(this.n), new Float32Array(this.n)];
    this.rand = mulberry32(seed);
  }

  /** mix the scratch buffer into a bus at sample offset */
  mix(sc, len, t0, gain, pan, bus = 'dry', revSend = 0, dlySend = 0) {
    const i0 = Math.round(t0 * SR);
    if (i0 >= this.n) return;
    const [gl, gr] = panGains(pan);
    const lim = Math.min(len, this.n - i0);
    const dry = this.dry;
    for (let i = 0; i < lim; i++) {
      const v = sc[i] * gain;
      dry[0][i0 + i] += v * gl;
      dry[1][i0 + i] += v * gr;
    }
    if (revSend > 0) {
      const r = this.rev;
      for (let i = 0; i < lim; i++) {
        const v = sc[i] * gain * revSend;
        r[0][i0 + i] += v * gl;
        r[1][i0 + i] += v * gr;
      }
    }
    if (dlySend > 0) {
      const d = this.dly;
      for (let i = 0; i < lim; i++) {
        const v = sc[i] * gain * dlySend;
        d[0][i0 + i] += v * gl;
        d[1][i0 + i] += v * gr;
      }
    }
  }

  /* ---------------- pad: 3 detuned saws, slow filter bloom ------------- */
  pad(t0, dur, freq, amp, pan, { cut = 900, att = 0.55, rel = 1.1, rev = 0.5 } = {}) {
    const n = Math.min(Math.floor((dur + rel) * SR), MAX_NOTE);
    const relS = Math.floor(rel * SR);
    const attS = Math.max(1, Math.floor(att * SR));
    const durS = Math.floor(dur * SR);
    const sc = scA;
    const det = 0.0055;
    const ph = [this.rand(), this.rand(), this.rand()];
    const fs = [freq * (1 - det), Math.sqrt(freq * freq * (1 - det * det)), freq * (1 + det)];
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let env;
      if (i < attS) env = i / attS;
      else if (i < durS) env = 1 - 0.18 * ((i - attS) / Math.max(1, durS - attS));
      else env = 0.82 * Math.pow(1 - (i - durS) / relS, 2);
      const fc = cut * (1.45 - 0.45 * Math.min(1, t / 1.4));
      const a = 1 - Math.exp((-TAU * fc) / SR);
      let s = 0;
      for (let v = 0; v < 3; v++) {
        ph[v] += fs[v] / SR;
        if (ph[v] >= 1) ph[v] -= 1;
        s += ph[v] * 2 - 1;
      }
      lp += a * (s - lp);
      sc[i] = Math.tanh(lp * 0.7) * env;
    }
    this.mix(sc, n, t0, amp * 0.33, pan, 'dry', rev, 0);
  }

  /* ---------------- rhodes-ish FM electric piano ---------------------- */
  ep(t0, dur, freq, amp, pan, { bright = 1, rev = 0.35, dly = 0.18 } = {}) {
    const rel = 0.9;
    const n = Math.min(Math.floor((dur + rel) * SR), MAX_NOTE);
    const durS = Math.floor(dur * SR);
    const relS = Math.floor(rel * SR);
    const sc = scA;
    const fm = freq * 2.0;
    let pc = this.rand();
    let pm = this.rand();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const idx = 2.1 * bright * Math.exp(-t / 0.28);
      const aenv = Math.exp(-t / (0.75 + dur * 0.35));
      const atk = Math.min(1, t / 0.006);
      let env = aenv * atk;
      if (i >= durS) env *= Math.pow(1 - (i - durS) / relS, 1.6);
      pc += freq / SR;
      if (pc >= 1) pc -= 1;
      pm += fm / SR;
      if (pm >= 1) pm -= 1;
      const mod = Math.sin(TAU * pm) * idx;
      const body = Math.sin(TAU * pc + mod);
      const tine = Math.sin(TAU * pc * 2 + mod * 2.4) * 0.16 * Math.exp(-t / 0.5);
      sc[i] = (body + tine) * env;
    }
    this.mix(sc, n, t0, amp, pan, 'dry', rev, dly);
  }

  /* ---------------- karplus-strong pluck ------------------------------ */
  pluck(t0, dur, freq, amp, pan, { damp = 0.996, rev = 0.3, dly = 0.22, bright = 1 } = {}) {
    const period = Math.max(2, Math.round(SR / freq));
    const buf = new Float32Array(period);
    // excitation: lowpassed noise burst
    let lp = 0;
    const a = 1 - Math.exp((-TAU * 2600 * bright) / SR);
    for (let i = 0; i < period; i++) {
      const nz = this.rand() * 2 - 1;
      lp += a * (nz - lp);
      buf[i] = lp;
    }
    const n = Math.min(Math.floor((dur + 0.35) * SR), MAX_NOTE);
    const relS = Math.floor(0.35 * SR);
    const durS = Math.floor(dur * SR);
    const sc = scB;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      const cur = buf[idx];
      const nxt = buf[(idx + 1) % period];
      const out = cur;
      const filtered = ((cur + nxt) * 0.5) * damp;
      buf[idx] = filtered;
      idx = (idx + 1) % period;
      let env = 1;
      if (i >= durS) env = Math.pow(1 - (i - durS) / relS, 2);
      sc[i] = out * env;
    }
    this.mix(sc, n, t0, amp, pan, 'dry', rev, dly);
  }

  /* ---------------- bass ---------------------------------------------- */
  bass(t0, dur, freq, amp, pan, { sub = 0.5, rev = 0.05 } = {}) {
    const rel = 0.18;
    const n = Math.min(Math.floor((dur + rel) * SR), MAX_NOTE);
    const durS = Math.floor(dur * SR);
    const relS = Math.floor(rel * SR);
    const sc = scA;
    let p1 = this.rand();
    let p2 = this.rand();
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const atk = Math.min(1, t / 0.012);
      let env = atk * (0.62 + 0.38 * Math.exp(-t / 0.45));
      if (i >= durS) env *= Math.pow(1 - (i - durS) / relS, 2);
      p1 += freq / SR;
      if (p1 >= 1) p1 -= 1;
      p2 += (freq * 0.5) / SR;
      if (p2 >= 1) p2 -= 1;
      const saw = Math.sin(TAU * p1) * 0.9 + (p1 * 2 - 1) * 0.22 + Math.sin(TAU * p2) * sub;
      const fc = 220 + 900 * Math.exp(-t / 0.18);
      const a = 1 - Math.exp((-TAU * fc) / SR);
      lp += a * (saw - lp);
      sc[i] = lp * env;
    }
    this.mix(sc, n, t0, amp, pan, 'dry', rev, 0);
  }

  /* ---------------- bell ---------------------------------------------- */
  bell(t0, dur, freq, amp, pan, { ratio = 2.76, rev = 0.55, dly = 0.25 } = {}) {
    const n = Math.min(Math.floor((dur + 1.8) * SR), MAX_NOTE);
    const sc = scB;
    let pc = this.rand();
    let pm = this.rand();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const env = Math.exp(-t / (dur * 0.55 + 0.35)) * Math.min(1, t / 0.003);
      pc += freq / SR;
      if (pc >= 1) pc -= 1;
      pm += (freq * ratio) / SR;
      if (pm >= 1) pm -= 1;
      const idx = 1.7 * Math.exp(-t / 0.35);
      sc[i] = Math.sin(TAU * pc + Math.sin(TAU * pm) * idx) * env;
    }
    this.mix(sc, n, t0, amp, pan, 'dry', rev, dly);
  }

  /* ---------------- drums --------------------------------------------- */
  kick(t0, amp = 0.9) {
    const dur = 0.42;
    const n = Math.floor(dur * SR);
    const sc = scA;
    let p = 0;
    let click = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = 46 + 110 * Math.exp(-t / 0.035);
      p += f / SR;
      if (p >= 1) p -= 1;
      const body = Math.sin(TAU * p) * Math.exp(-t / 0.16) * Math.min(1, t / 0.002);
      const c = i < 90 ? (this.rand() * 2 - 1) * 0.35 * (1 - i / 90) : 0;
      click = click * 0.6 + c * 0.4;
      sc[i] = Math.tanh((body + click) * 1.4);
    }
    this.mix(sc, n, t0, amp * 0.55, 0, 'dry', 0.04, 0);
  }

  snare(t0, amp = 0.5, pan = 0.05) {
    const dur = 0.26;
    const n = Math.floor(dur * SR);
    const sc = scA;
    let lp = 0;
    let hp = 0;
    let p = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const nz = this.rand() * 2 - 1;
      lp += 0.34 * (nz - lp);
      hp = nz - lp;
      p += 186 / SR;
      if (p >= 1) p -= 1;
      const body = Math.sin(TAU * p) * Math.exp(-t / 0.06) * 0.5;
      const env = Math.exp(-t / 0.075);
      sc[i] = (hp * 0.5 * env + body) * Math.min(1, t / 0.001);
    }
    this.mix(sc, n, t0, amp * 0.45, pan, 'dry', 0.16, 0);
  }

  hat(t0, amp = 0.3, pan = 0.28, open = false) {
    const dur = open ? 0.42 : 0.075;
    const n = Math.floor(dur * SR);
    const sc = scB;
    let lp = 0;
    const tau = open ? 0.11 : 0.019;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const nz = this.rand() * 2 - 1;
      lp += 0.12 * (nz - lp);
      const hp = nz - lp;
      sc[i] = hp * Math.exp(-t / tau) * Math.min(1, t / 0.001);
    }
    this.mix(sc, n, t0, amp * 0.34, pan, 'dry', 0.1, 0);
  }

  shaker(t0, amp = 0.22, pan = -0.25) {
    const dur = 0.13;
    const n = Math.floor(dur * SR);
    const sc = scB;
    let lp = 0;
    let lp2 = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const nz = this.rand() * 2 - 1;
      lp += 0.5 * (nz - lp);
      lp2 += 0.25 * (lp - lp2);
      const bp = lp - lp2;
      const env = Math.min(1, t / 0.012) * Math.exp(-t / 0.045);
      sc[i] = bp * env;
    }
    this.mix(sc, n, t0, amp * 0.5, pan, 'dry', 0.08, 0);
  }

  rim(t0, amp = 0.3, pan = -0.15) {
    const dur = 0.09;
    const n = Math.floor(dur * SR);
    const sc = scA;
    let p = 0;
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      p += 780 / SR;
      if (p >= 1) p -= 1;
      const nz = this.rand() * 2 - 1;
      lp += 0.4 * (nz - lp);
      const env = Math.exp(-t / 0.016);
      sc[i] = (Math.sin(TAU * p) * 0.6 + lp * 0.7) * env;
    }
    this.mix(sc, n, t0, amp * 0.4, pan, 'dry', 0.2, 0);
  }
}

/* ------------------------------------------------------------------ *
 * harmony helpers
 * ------------------------------------------------------------------ */

const SCALES = {
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

const CHORDS = {
  min9: [0, 3, 7, 10, 14],
  min7: [0, 3, 7, 10],
  min11: [0, 3, 7, 10, 14, 17],
  maj7: [0, 4, 7, 11],
  maj9: [0, 4, 7, 11, 14],
  dom7: [0, 4, 7, 10],
  dom9: [0, 4, 7, 10, 14],
  sus2: [0, 2, 7, 12],
  sus4: [0, 5, 7, 10],
  add9: [0, 4, 7, 14],
  min6: [0, 3, 7, 9],
};

/* ------------------------------------------------------------------ *
 * the tape machine: mix down, wobble, crackle, glue
 * ------------------------------------------------------------------ */

function wobble(buf, rate = 0.53, depthMs = 0.55, flutterMs = 0.09) {
  const n = buf.length;
  const out = new Float32Array(n);
  const d0 = 0.006 * SR;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const mod = Math.sin(TAU * rate * t) * depthMs * 0.001 * SR;
    const fl = Math.sin(TAU * 6.3 * t + 1.1) * flutterMs * 0.001 * SR;
    const delay = d0 + mod + fl + 0.02 * SR;
    const rp = i - delay;
    const i0 = Math.floor(rp);
    const fr = rp - i0;
    if (i0 < 1) {
      out[i] = 0;
      continue;
    }
    const a = buf[i0];
    const b = buf[i0 + 1] ?? a;
    out[i] = a + (b - a) * fr;
  }
  return out;
}

function crackle(n, rand, amount = 1) {
  const out = new Float32Array(n);
  const pops = Math.floor((n / SR) * 3.2 * amount);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const nz = rand() * 2 - 1;
    lp += 0.02 * (nz - lp);
    out[i] = lp * 0.55;
  }
  for (let p = 0; p < pops; p++) {
    const at = Math.floor(rand() * n);
    const amp = Math.pow(rand(), 3) * 0.45 * amount;
    const len = 40 + Math.floor(rand() * 220);
    let prev = 0;
    for (let i = 0; i < len && at + i < n; i++) {
      const t = i / SR;
      const click = (rand() * 2 - 1) * Math.exp(-t / 0.0011) * amp * (1 - i / len);
      prev = prev * 0.55 + click * 0.45;
      out[at + i] += prev;
    }
  }
  return out;
}

function softClip(x) {
  return Math.tanh(x * 1.25) / Math.tanh(1.25);
}

/* ------------------------------------------------------------------ *
 * arrangement
 * ------------------------------------------------------------------ */

const GROOVES = {
  brushed: {
    kick: [0, 10],
    snare: [4, 12],
    ghost: [7, 15],
    hat: 'eighths',
    hatAmp: 0.16,
    swing: 0.16,
  },
  lofi: {
    kick: [0, 7, 10],
    snare: [4, 12],
    ghost: [11],
    hat: 'eighths',
    hatAmp: 0.13,
    swing: 0.22,
  },
  house: {
    kick: [0, 4, 8, 12],
    snare: [],
    ghost: [],
    hat: 'offbeat',
    hatAmp: 0.2,
    swing: 0.06,
  },
  sparse: {
    kick: [0],
    snare: [8],
    ghost: [],
    hat: 'quarters',
    hatAmp: 0.11,
    swing: 0.1,
  },
  none: { kick: [], snare: [], ghost: [], hat: 'none', hatAmp: 0, swing: 0 },
};

function sectionPlan(bars) {
  // intro / build / main / outro, sized to the bar count
  const plan = [];
  const intro = 2;
  const outro = 2;
  let b = 0;
  plan.push({ type: 'intro', bars: intro });
  b += intro;
  const body = Math.max(1, bars - intro - outro);
  let i = 0;
  while (b < bars - outro) {
    const len = Math.min(body - i > 8 ? 8 : body - i, bars - outro - b);
    if (len <= 0) break;
    plan.push({ type: i === 0 ? 'a' : 'b', bars: len });
    b += len;
    i += len;
  }
  if (bars - b > 0) plan.push({ type: 'outro', bars: bars - b });
  return plan;
}

function renderTrack(spec) {
  const {
    id,
    seed = 1,
    bpm = 90,
    bars = 16,
    key = 50,
    scale = 'dorian',
    prog = [
      [0, 'min9'],
      [8, 'maj7'],
      [3, 'maj9'],
      [10, 'dom9'],
    ],
    mood = {},
  } = spec;

  const beat = 60 / bpm;
  const barLen = beat * 4;
  const tail = 2.8;
  const total = bars * barLen + tail;
  const st = new Studio(total, seed);
  const rand = mulberry32(seed * 7919 + 13);

  const steps = GROOVES[mood.groove || 'brushed'];
  const plan = sectionPlan(bars);
  const scaleNotes = SCALES[scale] || SCALES.dorian;

  const chordAt = (bar) => {
    const [off, quality] = prog[bar % prog.length];
    return {
      root: key + off,
      notes: CHORDS[quality].map((iv) => key + off + iv),
    };
  };

  const inScale = (m) => {
    const rel = ((m - key) % 12 + 12) % 12;
    return scaleNotes.includes(rel);
  };

  // snap a midi note into the current chord or scale
  const shape = (m, chord) => {
    let best = m;
    let bestD = 99;
    for (const c of chord.notes) {
      for (const oct of [-12, 0, 12]) {
        const cand = c + oct;
        const d = Math.abs(cand - m);
        if (d < bestD) {
          bestD = d;
          best = cand;
        }
      }
    }
    if (bestD <= 2) return best;
    return inScale(m) ? m : best;
  };

  let barCursor = 0;
  for (const sec of plan) {
    for (let bi = 0; bi < sec.bars; bi++) {
      const bar = barCursor + bi;
      const t0 = bar * barLen;
      const chord = chordAt(bar);
      const isIntro = sec.type === 'intro';
      const isOutro = sec.type === 'outro';
      const density = sec.type === 'b' ? 1 : sec.type === 'a' ? 0.7 : 0.35;
      const swingAmt = steps.swing * (beat / 2);

      /* ---- pad ---- */
      const padAmp = isIntro ? 0.5 : isOutro ? 0.42 : 0.3;
      const voicePad = chord.notes.slice(0, 4).map((m, i) => m + (i === 0 ? -12 : 0));
      voicePad.forEach((m, i) => {
        st.pad(t0, barLen * 0.98, midiHz(m), padAmp, (i - 1.5) * 0.35, {
          cut: 620 + i * 140 + (sec.type === 'b' ? 260 : 0),
          att: isIntro ? 0.9 : 0.45,
          rel: 1.2,
          rev: 0.55,
        });
      });

      /* ---- bass ---- */
      const bassPattern = isIntro ? [0] : isOutro ? [0, 2] : mood.bassPattern || [0, 1.5, 2, 3.5];
      for (const bpos of bassPattern) {
        if (rand() > 1 - (isIntro ? 0.8 : 0.95)) continue;
        const tt = t0 + bpos * beat;
        const oct = bpos === 3.5 && rand() > 0.5 ? 12 : 0;
        st.bass(tt, beat * (bpos === 0 ? 1.5 : 0.7), midiHz(chord.root - 12 + oct), 0.5, 0);
      }

      /* ---- drums ---- */
      if (!isIntro && !isOutro) {
        for (const s of steps.kick) {
          if (rand() > 0.94) continue;
          st.kick(t0 + (s / 4) * beat, 0.85);
        }
        for (const s of steps.snare) {
          st.snare(t0 + (s / 4) * beat, 0.5);
        }
        for (const s of steps.ghost) {
          if (rand() > 0.35) st.snare(t0 + (s / 4) * beat, 0.12, 0.12);
        }
        if (steps.hat !== 'none') {
          for (let s = 0; s < 16; s++) {
            const isOff = s % 2 === 1;
            let play = false;
            if (steps.hat === 'eighths') play = s % 2 === 0;
            else if (steps.hat === 'offbeat') play = s % 4 === 2;
            else if (steps.hat === 'quarters') play = s % 4 === 0;
            if (!play) continue;
            const sw = isOff ? swingAmt : 0;
            const accent = s % 8 === 4 ? 1 : 0.62;
            st.hat(t0 + (s / 4) * beat + sw, steps.hatAmp * accent * (0.8 + rand() * 0.4), 0.3);
          }
        }
        if (mood.shaker) {
          for (let s = 0; s < 16; s += 2) {
            st.shaker(t0 + (s / 4) * beat + (s % 4 ? swingAmt : 0), 0.16 * (0.7 + rand() * 0.6));
          }
        }
        if (mood.rim && bar % 2 === 1) st.rim(t0 + beat * 2.5, 0.24);
      }

      /* ---- keys comping ---- */
      if (sec.type !== 'intro') {
        const hits =
          sec.type === 'b'
            ? [0, 1.75, 2.5]
            : sec.type === 'a'
              ? [0, 2.5]
              : [0];
        for (const h of hits) {
          if (rand() > 0.9) continue;
          const voicing = chord.notes.slice(1, 4).map((m) => m + 12);
          voicing.forEach((m, i) => {
            st.ep(
              t0 + h * beat + (rand() - 0.5) * 0.012,
              beat * (1.1 + rand() * 0.5),
              midiHz(shape(m + (mood.keysUp ? 12 : 0), chord)),
              0.15 * (1 - i * 0.12) * (0.85 + rand() * 0.3),
              (i - 1) * 0.4,
              { bright: 0.8 + density * 0.4, rev: 0.4, dly: 0.16 },
            );
          });
        }
      }

      /* ---- arpeggio / melody ---- */
      if (mood.arp && sec.type === 'b') {
        const rate = mood.arpRate || 8;
        const seq = [0, 2, 1, 3, 2, 4, 3, 1];
        for (let s = 0; s < rate; s++) {
          if (rand() > 0.78) continue;
          const tS = (s / rate) * barLen;
          const deg = seq[s % seq.length];
          const oct = mood.arpOct ?? 1;
          const note = chord.notes[deg % chord.notes.length] + 12 * oct;
          const tt = t0 + tS + (s % 2 ? swingAmt : 0);
          if (mood.arpVoice === 'bell') {
            st.bell(tt, beat * 0.5, midiHz(note), 0.11, (rand() - 0.5) * 0.7, { rev: 0.5 });
          } else {
            st.pluck(tt, beat * 0.42, midiHz(note), 0.16, (rand() - 0.5) * 0.6, {
              damp: 0.994,
              rev: 0.3,
              dly: 0.22,
              bright: 0.9,
            });
          }
        }
      }

      if (mood.melody && sec.type === 'b' && bi % 2 === 0) {
        // a two-bar phrase, played over the top of the arp
        const phraseLen = 8;
        for (let s = 0; s < phraseLen; s++) {
          if (rand() > 0.55) continue;
          const scaleIdx = Math.floor(rand() * scaleNotes.length);
          const oct = 1 + (rand() > 0.72 ? 1 : 0);
          const note = key + scaleNotes[scaleIdx] + 12 * oct;
          const tt = t0 + (s / phraseLen) * barLen * 2 + rand() * 0.02;
          st.ep(tt, beat * (0.9 + rand()), midiHz(note), 0.13, (rand() - 0.5) * 0.5, {
            bright: 1.05,
            rev: 0.5,
            dly: 0.28,
          });
        }
      }

      /* ---- fill at the end of a section ---- */
      if (!isIntro && !isOutro && bi === sec.bars - 1 && rand() > 0.4) {
        for (let s = 0; s < 4; s++) {
          st.snare(t0 + beat * (3 + s * 0.25), 0.16 + s * 0.07, 0.08);
        }
      }
    }
    barCursor += sec.bars;
  }

  /* ---------------- mix down ---------------- */
  const revL = reverbChannel(st.rev[0], makeReverb(total), 0);
  const revR = reverbChannel(st.rev[1], makeReverb(total), 23);

  // ping-pong delay
  const dTime = Math.floor(beat * 0.75 * SR);
  const dlyOut = [new Float32Array(st.n), new Float32Array(st.n)];
  const dl = new Float32Array(dTime * 2);
  let dIdx = 0;
  let fbL = 0;
  let fbR = 0;
  for (let i = 0; i < st.n; i++) {
    const lIdx = dIdx;
    const rIdx = dIdx + dTime;
    const takeL = dl[lIdx % (dTime * 2)];
    const takeR = dl[rIdx % (dTime * 2)];
    fbL = fbL * 0.55 + takeL * 0.45;
    fbR = fbR * 0.55 + takeR * 0.45;
    dl[lIdx % (dTime * 2)] = st.dly[0][i] + fbR * 0.42;
    dl[rIdx % (dTime * 2)] = st.dly[1][i] + fbL * 0.42;
    dlyOut[0][i] = takeL * 0.5;
    dlyOut[1][i] = takeR * 0.5;
    dIdx++;
  }

  const outL = new Float32Array(st.n);
  const outR = new Float32Array(st.n);
  let hpL = 0;
  let hpR = 0;
  let prevL = 0;
  let prevR = 0;
  let airLpL = 0;
  let airLpR = 0;
  const airA = 1 - Math.exp((-TAU * 2600) / SR);
  for (let i = 0; i < st.n; i++) {
    const l = st.dry[0][i] + revL[i] * 0.42 + dlyOut[0][i];
    const r = st.dry[1][i] + revR[i] * 0.42 + dlyOut[1][i];
    // gentle highpass (removes rumble, keeps the low end tight)
    hpL = 0.999 * (hpL + l - prevL);
    hpR = 0.999 * (hpR + r - prevR);
    prevL = l;
    prevR = r;
    // a lift above ~2.6k so the hats and tines read as air, not mud
    airLpL += airA * (hpL - airLpL);
    airLpR += airA * (hpR - airLpR);
    outL[i] = hpL + (hpL - airLpL) * 0.32;
    outR[i] = hpR + (hpR - airLpR) * 0.32;
  }

  const wl = wobble(outL);
  const wr = wobble(outR);
  const cr = crackle(st.n, rand, 0.9);

  const fadeIn = Math.floor(0.4 * SR);
  const fadeOut = Math.floor(1.8 * SR);
  let peak = 0;
  for (let i = 0; i < st.n; i++) {
    let env = 1;
    if (i < fadeIn) env = i / fadeIn;
    const fromEnd = st.n - i;
    if (fromEnd < fadeOut) env *= Math.pow(fromEnd / fadeOut, 1.4);
    const c = cr[i] * 0.55;
    outL[i] = softClip((wl[i] + c) * 1.05) * env;
    outR[i] = softClip((wr[i] + c * 0.9) * 1.05) * env;
    peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
  }

  // normalise to a comfortable -2.5 dBFS
  const target = 0.75;
  const g = peak > 0 ? target / peak : 1;
  for (let i = 0; i < st.n; i++) {
    outL[i] *= g;
    outR[i] *= g;
  }

  return { left: outL, right: outR, seconds: st.n / SR };
}

/* ------------------------------------------------------------------ *
 * peaks + encode
 * ------------------------------------------------------------------ */

function makePeaks(left, right, buckets = 96) {
  const n = left.length;
  const per = Math.floor(n / buckets);
  const peaks = [];
  for (let b = 0; b < buckets; b++) {
    let sum = 0;
    const start = b * per;
    for (let i = 0; i < per; i += 24) {
      const v = (Math.abs(left[start + i]) + Math.abs(right[start + i])) * 0.5;
      sum += v;
    }
    peaks.push(Math.round((sum / Math.ceil(per / 24)) * 1000) / 1000);
  }
  return peaks;
}

async function loadLame() {
  const src = fs.readFileSync(path.join(ROOT, 'node_modules/lamejs/lame.all.js'), 'utf8');
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.lamejs;
}

function encode(lamejs, left, right, kbps) {
  const enc = new lamejs.Mp3Encoder(2, SR, kbps);
  const toI16 = (f, a, b) => {
    const out = new Int16Array(b - a);
    for (let i = a; i < b; i++) out[i - a] = clamp(Math.round(f[i] * 32767), -32768, 32767);
    return out;
  };
  const block = 1152;
  const chunks = [];
  for (let i = 0; i < left.length; i += block) {
    const end = Math.min(i + block, left.length);
    const l = toI16(left, i, end);
    const r = toI16(right, i, end);
    // lame needs full blocks; pad the final partial block
    let li = l;
    let ri = r;
    if (l.length < block) {
      li = new Int16Array(block);
      ri = new Int16Array(block);
      li.set(l);
      ri.set(r);
    }
    const buf = enc.encodeBuffer(li, ri);
    if (buf.length) chunks.push(Buffer.from(buf));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

/* ------------------------------------------------------------------ *
 * the record collection
 * ------------------------------------------------------------------ */

const LIBRARY = [
  {
    album: 'm1',
    spec: {
      seed: 11,
      bpm: 92,
      bars: 14,
      key: 50, // D
      scale: 'dorian',
      prog: [[0, 'min9'], [8, 'maj7'], [3, 'min7'], [10, 'dom9']],
      mood: { groove: 'brushed', arp: true, arpVoice: 'pluck', arpRate: 8, melody: true, shaker: true },
    },
    tracks: [
      { id: 'm1a', title: 'Chrome Rain', bars: 14 },
      { id: 'm1b', title: 'Neon Underglow', bpm: 88, bars: 16, key: 55 },
      { id: 'm1c', title: 'Tollbooth at 3AM', bpm: 84, bars: 12, key: 48, mood: { groove: 'sparse', arp: true } },
      { id: 'm1d', title: 'Rearview Halo', bpm: 96, bars: 16, key: 52, mood: { groove: 'lofi', arp: true, melody: true } },
    ],
  },
  {
    album: 'g2',
    spec: {
      seed: 23,
      bpm: 76,
      bars: 12,
      key: 57, // A
      scale: 'lydian',
      prog: [[0, 'maj9'], [5, 'maj7'], [7, 'add9'], [2, 'sus2']],
      mood: { groove: 'sparse', arp: true, arpVoice: 'bell', arpRate: 6, arpOct: 2, keysUp: true },
    },
    tracks: [
      { id: 'g2a', title: 'Sea Glass', bars: 12 },
      { id: 'g2b', title: 'Vertical Light', bpm: 70, bars: 14, key: 53 },
      { id: 'g2c', title: 'Slow Meridian', bpm: 82, bars: 14, key: 60, mood: { groove: 'brushed', arp: true, arpVoice: 'bell' } },
      { id: 'g2d', title: 'Aperture', bpm: 72, bars: 12, key: 55, mood: { groove: 'none', arp: true, arpVoice: 'bell', melody: true } },
    ],
  },
  {
    album: 'a3',
    spec: {
      seed: 37,
      bpm: 104,
      bars: 16,
      key: 55, // G
      scale: 'aeolian',
      prog: [[0, 'min7'], [8, 'maj7'], [3, 'maj9'], [10, 'dom7']],
      mood: { groove: 'lofi', arp: true, arpRate: 8, melody: true, shaker: true, rim: true },
    },
    tracks: [
      { id: 'a3a', title: 'Lantern Oil', bars: 16 },
      { id: 'a3b', title: 'Amber Static', bpm: 100, bars: 14, key: 51 },
      { id: 'a3c', title: 'Two-Step Lobby', bpm: 108, bars: 16, key: 58, mood: { groove: 'brushed', shaker: true } },
      { id: 'a3d', title: 'Copper Hymn', bpm: 96, bars: 12, key: 55, mood: { groove: 'sparse', melody: true, arp: false } },
    ],
  },
  {
    album: 'p4',
    spec: {
      seed: 41,
      bpm: 68,
      bars: 12,
      key: 53, // F
      scale: 'major',
      prog: [[0, 'maj9'], [9, 'min7'], [5, 'maj7'], [7, 'sus4']],
      mood: { groove: 'none', arp: true, arpVoice: 'pluck', arpRate: 6, melody: true, keysUp: true },
    },
    tracks: [
      { id: 'p4a', title: 'Paper Moons', bars: 12 },
      { id: 'p4b', title: 'Folded Light', bpm: 72, bars: 12, key: 57 },
      { id: 'p4c', title: 'Quiet Hours', bpm: 64, bars: 10, key: 50, mood: { groove: 'none', melody: true } },
      { id: 'p4d', title: 'Lullaby for a Stranger', bpm: 60, bars: 12, key: 55, mood: { groove: 'sparse', arp: true, arpVoice: 'bell' } },
    ],
  },
  {
    album: 'v5',
    spec: {
      seed: 53,
      bpm: 112,
      bars: 16,
      key: 48, // C
      scale: 'aeolian',
      prog: [[0, 'min9'], [5, 'min11'], [3, 'maj9'], [10, 'dom9']],
      mood: { groove: 'house', arp: true, arpRate: 8, shaker: true, bassPattern: [0, 1.5, 2, 3] },
    },
    tracks: [
      { id: 'v5a', title: 'Velvet District', bars: 16 },
      { id: 'v5b', title: 'Basement Blue', bpm: 116, bars: 16, key: 51 },
      { id: 'v5c', title: 'Rope & Brass', bpm: 108, bars: 14, key: 46, mood: { groove: 'lofi', rim: true } },
      { id: 'v5d', title: 'After Hours Apartment', bpm: 104, bars: 14, key: 53, mood: { groove: 'brushed', arp: true, melody: true } },
    ],
  },
  {
    album: 'l6',
    spec: {
      seed: 67,
      bpm: 84,
      bars: 14,
      key: 52, // E
      scale: 'dorian',
      prog: [[0, 'min7'], [3, 'maj7'], [7, 'sus2'], [10, 'maj9']],
      mood: { groove: 'brushed', arp: true, arpRate: 8, shaker: true, melody: true },
    },
    tracks: [
      { id: 'l6a', title: 'Low Tide Radio', bars: 14 },
      { id: 'l6b', title: 'Salt on the Dial', bpm: 80, bars: 12, key: 57 },
      { id: 'l6c', title: 'Fog Signal', bpm: 88, bars: 12, key: 48, mood: { groove: 'lofi', arp: true, arpVoice: 'bell' } },
      { id: 'l6d', title: 'Driftwood', bpm: 76, bars: 12, key: 55, mood: { groove: 'none', melody: true } },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
const debugWav = process.argv.includes('--wav');
const outDir = path.join(ROOT, 'public/audio');
fs.mkdirSync(outDir, { recursive: true });

const lamejs = await loadLame();
const metaPath = path.join(ROOT, 'src/data/audio-meta.json');
let meta = {};
if (fs.existsSync(metaPath)) {
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    meta = {};
  }
}

for (const entry of LIBRARY) {
  for (const t of entry.tracks) {
    if (only && t.id !== only && entry.album !== only) continue;
    const spec = {
      ...entry.spec,
      ...t,
      album: entry.album,
      mood: { ...(entry.spec.mood || {}), ...(t.mood || {}) },
    };
    const started = Date.now();
    const { left, right, seconds } = renderTrack(spec);
    const mp3 = encode(lamejs, left, right, 64);
    fs.writeFileSync(path.join(outDir, `${t.id}.mp3`), mp3);
    if (debugWav) {
      const frames = left.length;
      const buf = Buffer.alloc(44 + frames * 4);
      buf.write('RIFF', 0); buf.writeUInt32LE(36 + frames * 4, 4); buf.write('WAVE', 8);
      buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
      buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
      buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
      buf.write('data', 36); buf.writeUInt32LE(frames * 4, 40);
      for (let i = 0; i < frames; i++) {
        buf.writeInt16LE(clamp(Math.round(left[i] * 32767), -32768, 32767), 44 + i * 4);
        buf.writeInt16LE(clamp(Math.round(right[i] * 32767), -32768, 32767), 46 + i * 4);
      }
      fs.writeFileSync(path.join('/tmp', `${t.id}.wav`), buf);
    }
    const peaks = makePeaks(left, right);
    meta[t.id] = {
      duration: Math.round(seconds * 100) / 100,
      peaks,
      bytes: mp3.length,
    };
    console.log(
      `${t.id}  ${t.title.padEnd(26)} ${seconds.toFixed(1)}s  ${(mp3.length / 1024).toFixed(0)}KB  ${Date.now() - started}ms`,
    );
  }
}

fs.mkdirSync(path.dirname(metaPath), { recursive: true });
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
console.log(`\nwrote ${Object.keys(meta).length} tracks → ${outDir}`);
