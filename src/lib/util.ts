const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape a value before it goes into an HTML string. */
export function esc(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** 12400 -> "12.4k" */
export function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

export function has<T>(arr: readonly T[], value: T): boolean {
  return arr.indexOf(value) > -1;
}

/** Toggle membership. `front` puts the value at the start instead of the end. */
export function flip<T>(arr: T[], value: T, front = false): boolean {
  const i = arr.indexOf(value);
  if (i > -1) {
    arr.splice(i, 1);
    return false;
  }
  if (front) arr.unshift(value);
  else arr.push(value);
  return true;
}

export function $(sel: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(sel);
}

export function $all(sel: string, root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(sel));
}

export function dayLabel(date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}
