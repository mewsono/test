/**
 * A single <audio> element, routed through a small Web Audio graph so the
 * five-band EQ in the sheet is a real EQ and not a decoration.
 *
 *   source → band ×5 → analyser → master gain → out
 */

export type EngineEvent =
  | { type: 'time' }
  | { type: 'durationchange' }
  | { type: 'playing' }
  | { type: 'ended' }
  | { type: 'error'; message: string };

export const EQ_FREQS = [60, 250, 1000, 4000, 12000] as const;
export const EQ_LABELS = ['60', '250', '1k', '4k', '12k'] as const;

export class Engine {
  readonly audio: HTMLAudioElement;
  private ctx?: AudioContext;
  private master?: GainNode;
  private analyser?: AnalyserNode;
  private bands: BiquadFilterNode[] = [];
  private levels?: Uint8Array;
  private listeners = new Set<(e: EngineEvent) => void>();
  private volume = 0.8;
  private eq: number[] = EQ_FREQS.map(() => 0);

  constructor() {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = this.volume;
    this.audio = audio;

    const emit = (e: EngineEvent) => this.emit(e);
    audio.addEventListener('timeupdate', () => emit({ type: 'time' }));
    audio.addEventListener('durationchange', () => emit({ type: 'durationchange' }));
    audio.addEventListener('playing', () => emit({ type: 'playing' }));
    audio.addEventListener('pause', () => emit({ type: 'playing' }));
    audio.addEventListener('ended', () => emit({ type: 'ended' }));
    audio.addEventListener('error', () =>
      emit({ type: 'error', message: 'That track would not play. Check the file.' }),
    );
  }

  subscribe(fn: (e: EngineEvent) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(e: EngineEvent) {
    this.listeners.forEach((l) => l(e));
  }

  /** the graph can only be built from a gesture, so it waits for the first play */
  private build() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx: AudioContext = new Ctx();
    const src = ctx.createMediaElementSource(this.audio);
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;
    this.levels = new Uint8Array(this.analyser.fftSize);

    let node: AudioNode = src;
    this.bands = EQ_FREQS.map((f, i) => {
      const b = ctx.createBiquadFilter();
      b.type = 'peaking';
      b.frequency.value = f;
      b.Q.value = 1.1;
      b.gain.value = this.eq[i];
      node.connect(b);
      node = b;
      return b;
    });
    node.connect(this.analyser);
    this.analyser.connect(this.master);
    this.master.connect(ctx.destination);
    this.ctx = ctx;
  }

  async resume() {
    this.build();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  async play() {
    await this.resume();
    try {
      await this.audio.play();
    } catch {
      /* the gesture wasn't trusted yet — the next tap will work */
    }
  }

  pause() {
    this.audio.pause();
  }

  async toggle() {
    if (this.audio.paused) await this.play();
    else this.pause();
  }

  load(src: string, autoplay: boolean) {
    if (this.audio.src.endsWith(src)) {
      if (autoplay) void this.play();
      return;
    }
    this.audio.src = src;
    this.audio.load();
    if (autoplay) void this.play();
  }

  seek(t: number) {
    if (!Number.isFinite(t)) return;
    const d = this.audio.duration;
    this.audio.currentTime = Number.isFinite(d) ? Math.max(0, Math.min(d - 0.05, t)) : Math.max(0, t);
    this.emit({ type: 'time' });
  }

  nudge(delta: number) {
    this.seek(this.audio.currentTime + delta);
  }

  get currentTime() {
    return this.audio.currentTime || 0;
  }

  get duration() {
    const d = this.audio.duration;
    return Number.isFinite(d) && d > 0 ? d : 0;
  }

  get playing() {
    return !this.audio.paused && !this.audio.ended;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.audio.volume = this.volume;
    if (this.master) this.master.gain.value = this.volume;
  }

  getVolume() {
    return this.volume;
  }

  setBand(i: number, gainDb: number) {
    this.eq[i] = gainDb;
    if (this.bands[i]) this.bands[i].gain.value = gainDb;
  }

  getBands() {
    return [...this.eq];
  }

  resetBands() {
    this.eq = EQ_FREQS.map(() => 0);
    this.bands.forEach((b) => (b.gain.value = 0));
  }

  /** 0..1 RMS of what is coming out right now — feeds the wavy progress line */
  level(): number {
    if (!this.analyser || !this.levels) return 0;
    this.analyser.getByteTimeDomainData(this.levels as Uint8Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < this.levels.length; i++) {
      const v = (this.levels[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.levels.length) * 3.2);
  }
}

let engine: Engine | null = null;
export function getEngine(): Engine {
  if (!engine) engine = new Engine();
  return engine;
}
