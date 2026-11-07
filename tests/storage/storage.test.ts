import { describe, expect, it } from 'vitest';
import { createLocalAdapter, createMemoryAdapter } from '../../src/storage/adapter';
import { migrate } from '../../src/storage/migrate';
import { exportJson, importJson } from '../../src/storage/backup';
import { emptyState, type PlayerState } from '../../src/domain/types';

class FakeStorage implements Storage {
  data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(k: string) { return this.data.get(k) ?? null; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  removeItem(k: string) { this.data.delete(k); }
  setItem(k: string, v: string) { this.data.set(k, v); }
}
const throwing = (): Storage => ({
  length: 0, clear() {}, key: () => null, removeItem() {},
  getItem() { throw new DOMException('denied', 'SecurityError'); },
  setItem() { throw new DOMException('denied', 'SecurityError'); },
});

const sample = (): PlayerState => ({
  ...emptyState(), nickname: '모험가', characterId: 'ember', focusStats: ['str', 'int'],
  xp: { str: 120, agi: 0, int: 40, spi: 0, luk: 5 }, unlockedIds: ['title:novice'], totalCleared: 7, lastDate: '2026-11-09',
  weeks: [{ weekId: '2026-11-09', theme: 'normal', weeklyBonus: false, clearRate: null,
    days: [{ date: '2026-11-09', allDoneBonus: false, quests: [{ questId: 'str-01', done: true }, { questId: 'int-02', done: false }] }] }],
});

describe('local adapter', () => {
  it('saves and loads the same state', () => {
    const a = createLocalAdapter(new FakeStorage());
    expect(a.save(sample())).toBe(true);
    expect(a.load()).toEqual({ state: sample(), recovered: false });
  });
  it('returns null state when nothing is saved', () => {
    expect(createLocalAdapter(new FakeStorage()).load()).toEqual({ state: null, recovered: false });
  });
  it('corrupt JSON is backed up and reported as recovered', () => {
    const s = new FakeStorage();
    s.setItem('lifegame:v1', '{not json');
    const out = createLocalAdapter(s).load();
    expect(out).toEqual({ state: null, recovered: true });
    const backupKey = [...s.data.keys()].find((k) => k.startsWith('lifegame:backup:'));
    expect(backupKey).toBeDefined();
    expect(s.getItem(backupKey!)).toBe('{not json');
  });
  it('valid JSON with an invalid shape is treated as corrupt', () => {
    const s = new FakeStorage();
    s.setItem('lifegame:v1', JSON.stringify({ ...sample(), xp: { ...sample().xp, str: -5 } }));
    expect(createLocalAdapter(s).load()).toEqual({ state: null, recovered: true });
  });
  it('storage that throws (private mode) falls back to memory without throwing', () => {
    const a = createLocalAdapter(throwing());
    expect(a.load()).toEqual({ state: null, recovered: false });
    expect(a.save(sample())).toBe(false);
    expect(a.load().state).toEqual(sample());
  });
  it('quota exceeded does not throw and reports false', () => {
    const s = new FakeStorage();
    s.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    expect(createLocalAdapter(s).save(sample())).toBe(false);
  });
  it('works with no storage available at all', () => {
    const a = createLocalAdapter();
    expect(() => a.load()).not.toThrow();
  });
  it('memory adapter round-trips', () => {
    const a = createMemoryAdapter();
    a.save(sample());
    expect(a.load().state).toEqual(sample());
  });
});

describe('migrate / export / import', () => {
  it('rejects negative, non-finite or missing xp and wrong version', () => {
    expect(migrate({ ...sample(), xp: { ...sample().xp, int: -1 } })).toBeNull();
    expect(migrate({ ...sample(), xp: { ...sample().xp, int: Infinity } })).toBeNull();
    expect(migrate({ ...sample(), xp: undefined })).toBeNull();
    expect(migrate({ ...sample(), version: 9 })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate(sample())).toEqual(sample());
  });
  it('nickname limit counts characters, not UTF-16 units (emoji nicknames survive a reload)', () => {
    expect(migrate({ ...sample(), nickname: '😀'.repeat(20) })).not.toBeNull();
    expect(migrate({ ...sample(), nickname: '😀'.repeat(21) })).toBeNull();
  });
  it('rejects saves that would break the UI', () => {
    expect(migrate({ ...sample(), characterId: 'nope' })).toBeNull();
    expect(migrate({ ...sample(), lastDate: 'zzz' })).toBeNull();
    expect(migrate({ ...sample(), focusStats: null })).toBeNull();
    expect(migrate({ ...sample(), characterId: null })).toBeNull();
    const s = sample();
    s.weeks[0].days[0].date = 'someday';
    expect(migrate(s)).toBeNull();
    expect(migrate({ ...emptyState() })).not.toBeNull();
  });
  it('upgrades a v1 save to v2 with default settings', () => {
    const { settings, backup, reportSeenWeek, ...rest } = sample();
    void settings; void backup; void reportSeenWeek;
    const up = migrate({ ...rest, version: 1 });
    expect(up).toEqual({ ...rest, version: 2, settings: { dayStartHour: 0 }, backup: { lastAt: null, nudgedAt: null }, reportSeenWeek: null });
  });
  it('validates the v2 fields', () => {
    expect(migrate({ ...sample(), settings: { dayStartHour: 7 } })).toBeNull();
    expect(migrate({ ...sample(), settings: { dayStartHour: 2.5 } })).toBeNull();
    expect(migrate({ ...sample(), backup: { lastAt: 'x', nudgedAt: null } })).toBeNull();
    expect(migrate({ ...sample(), reportSeenWeek: 5 })).toBeNull();
    const s = sample();
    s.weeks[0].days[0].swaps = -1;
    expect(migrate(s)).toBeNull();
  });
  it('import(export(s)) equals s', () => {
    expect(importJson(exportJson(sample()))).toEqual(sample());
  });
  it('import rejects junk with INVALID_SAVE', () => {
    for (const bad of ['{}', '[]', 'hello', JSON.stringify({ ...sample(), version: 9 })])
      expect(() => importJson(bad)).toThrow('INVALID_SAVE');
  });
});
