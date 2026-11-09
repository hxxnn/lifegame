import { CHARACTERS } from '../../data/characters';
import { composeAvatar, type Pixel } from '../../data/sprites';

/** 같은 줄에서 색이 같은 칸을 이어 붙여 사각형 수를 줄인다. */
function runs(pixels: Pixel[]): { x: number; y: number; w: number; c: string }[] {
  const out: { x: number; y: number; w: number; c: string }[] = [];
  const sorted = [...pixels].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && last.y === p.y && last.c === p.c && last.x + last.w === p.x) last.w++;
    else out.push({ x: p.x, y: p.y, w: 1, c: p.c });
  }
  return out;
}

export function CharacterAvatar({ id, size = 96, unlockedIds = [] }: { id: string; size?: number; unlockedIds?: string[] }) {
  const c = CHARACTERS.find((x) => x.id === id) ?? CHARACTERS[0];
  const a = composeAvatar(c.id, unlockedIds);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label={`${c.name} 캐릭터`} style={{ borderRadius: Math.round(size / 6), display: 'block' }}>
      <rect width="16" height="16" fill={c.palette[1]} opacity={a.scene ? 0 : 0.22} />
      {a.scene && runs(a.scene).map((r, i) => <rect key={`s${i}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.c} />)}
      {runs(a.behind).map((r, i) => <rect key={`b${i}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.c} />)}
      {runs(a.sprite).map((r, i) => <rect key={`p${i}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.c} />)}
      {runs(a.front).map((r, i) => <rect key={`f${i}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.c} />)}
    </svg>
  );
}
