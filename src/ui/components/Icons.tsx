import type { StatId } from '../../domain/types';

const PATHS: Record<string, string> = {
  str: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12',
  agi: 'M13 2 4 14h7l-1 8 9-12h-7z',
  int: 'M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14',
  spi: 'M12 20c-4 0-7-3-7-7 3 0 5 1.5 7 4 2-2.5 4-4 7-4 0 4-3 7-7 7zM12 17c-2-2-3-5 0-10 3 5 2 8 0 10z',
  luk: 'M12 13l4 8M9 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM15 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM9 11.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM15 11.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  character: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 4-6 8-6s8 2 8 6',
  gallery: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-3 0-5-1-5-3s3-2 5 3c2-5 5-5 5-3s-2 3-5 3',
  share: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  check: 'M5 12l5 5 9-10',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName | StatId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
