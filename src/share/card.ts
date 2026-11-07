import { CHARACTERS } from '../data/characters';
import { COSMETIC_LABELS } from '../data/cosmetics';
import { STAT_IDS, STAT_NAMES } from '../domain/types';
import { decodeShare, encodeShare, type SharePayload } from './codec';

const PREFIX = '#/compare/';

export function shareUrl(base: string, payload: SharePayload): string {
  return `${base.replace(/index\.html$/, '').replace(/\/$/, '')}/${PREFIX}${encodeShare(payload)}`;
}

export function isCompareHash(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

export function parseCompareHash(hash: string): SharePayload | null {
  const m = /^#\/compare\/([A-Za-z0-9_-]+)$/.exec(hash);
  return m ? decodeShare(m[1]) : null;
}

const STAT_COLORS: Record<string, string> = { str: '#ef6351', agi: '#4cc9f0', int: '#9b8cff', spi: '#5fd3a5', luk: '#ffd166' };

/** Draws a 600x340 share card on a canvas (browser only). */
export function renderCardPng(p: SharePayload): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 340;
  const g = canvas.getContext('2d')!;
  const ch = CHARACTERS.find((c) => c.id === p.char) ?? CHARACTERS[0];
  g.fillStyle = '#14121f';
  g.fillRect(0, 0, 600, 340);
  g.fillStyle = ch.palette[0];
  g.fillRect(0, 0, 600, 8);
  g.beginPath();
  g.arc(70, 90, 44, 0, Math.PI * 2);
  g.fillStyle = ch.palette[0];
  g.fill();
  g.fillStyle = '#fff';
  g.font = 'bold 40px sans-serif';
  g.textAlign = 'center';
  g.fillText(ch.name.slice(0, 1), 70, 104);
  g.textAlign = 'left';
  g.font = 'bold 28px sans-serif';
  g.fillText(p.nick, 136, 78);
  g.font = '16px sans-serif';
  g.fillStyle = '#a49cc2';
  g.fillText(`${ch.name} · ${p.title ? COSMETIC_LABELS[p.title] : '칭호 없음'} · 클리어 ${p.cleared}`, 136, 106);
  STAT_IDS.forEach((s, i) => {
    const y = 170 + i * 30;
    g.fillStyle = STAT_COLORS[s];
    g.font = 'bold 16px sans-serif';
    g.fillText(`${STAT_NAMES[s]}${p.focus.includes(s) ? ' ★' : ''}`, 36, y);
    g.fillStyle = '#2a2540';
    g.fillRect(130, y - 14, 380, 14);
    g.fillStyle = STAT_COLORS[s];
    g.fillRect(130, y - 14, (380 * p.lv[s]) / 30, 14);
    g.fillStyle = '#f1eefc';
    g.fillText(`Lv.${p.lv[s]}`, 524, y);
  });
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG_FAILED'))), 'image/png'));
}
