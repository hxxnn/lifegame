import type { Rng } from './types';

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(items: { item: T; weight: number }[], rng: Rng): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const it of items) {
    if (r < it.weight) return it.item;
    r -= it.weight;
  }
  return items[items.length - 1].item;
}
