import { CHARACTERS, type CharacterShape } from '../../data/characters';

const SKIN = '#f2c9a0';

function Gear({ shape, a, b }: { shape: CharacterShape; a: string; b: string }) {
  switch (shape) {
    case 'knight':
      return (<><path d="M30 44 Q50 14 70 44 Z" fill={a} /><rect x="76" y="30" width="4" height="40" rx="2" fill={b} /><rect x="71" y="52" width="14" height="4" rx="2" fill={b} /></>);
    case 'ninja':
      return (<><rect x="30" y="40" width="40" height="10" fill="#222" /><rect x="30" y="34" width="40" height="5" fill={b} /><path d="M70 36 l12 -4 l-6 10 z" fill={b} /></>);
    case 'mage':
      return (<><path d="M50 4 L72 40 L28 40 Z" fill={a} /><circle cx="50" cy="26" r="4" fill={b} /><rect x="22" y="38" width="56" height="5" rx="2" fill={b} /></>);
    case 'monk':
      return (<><circle cx="50" cy="66" r="14" fill="none" stroke={b} strokeWidth="3" strokeDasharray="4 3" /><circle cx="50" cy="38" r="3" fill={b} /></>);
    case 'archer':
      return (<><path d="M28 46 Q50 12 72 46 L66 46 Q50 24 34 46 Z" fill={a} /><path d="M78 24 Q92 50 78 76" fill="none" stroke={b} strokeWidth="3" /><line x1="78" y1="24" x2="78" y2="76" stroke={b} strokeWidth="1" /></>);
    case 'rogue':
      return (<><path d="M26 50 Q50 8 74 50 L62 46 Q50 28 38 46 Z" fill={a} /><path d="M72 62 l12 -8 l2 4 l-12 10 z" fill={b} /></>);
    case 'bard':
      return (<><ellipse cx="50" cy="32" rx="26" ry="8" fill={a} /><path d="M34 30 Q50 6 66 30 Z" fill={a} /><circle cx="76" cy="64" r="5" fill={b} /><rect x="80" y="44" width="3" height="20" fill={b} /></>);
    case 'beast':
      return (<><path d="M30 44 L28 22 L42 34 Z" fill={a} /><path d="M70 44 L72 22 L58 34 Z" fill={a} /><path d="M44 56 l3 6 l3 -6 z M50 56 l3 6 l3 -6 z" fill="#fff" /></>);
  }
}

export function CharacterAvatar({ id, size = 96 }: { id: string; size?: number }) {
  const c = CHARACTERS.find((x) => x.id === id) ?? CHARACTERS[0];
  const [a, b] = c.palette;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${c.name} 캐릭터`}>
      <circle cx="50" cy="50" r="48" fill={b} opacity="0.25" />
      <path d="M18 98 Q20 68 50 68 Q80 68 82 98 Z" fill={a} />
      <circle cx="50" cy="48" r="18" fill={SKIN} />
      <circle cx="43" cy="48" r="2" fill="#2b2b2b" />
      <circle cx="57" cy="48" r="2" fill="#2b2b2b" />
      <path d="M44 56 Q50 60 56 56" fill="none" stroke="#2b2b2b" strokeWidth="1.5" strokeLinecap="round" />
      <Gear shape={c.shape} a={a} b={b} />
    </svg>
  );
}
