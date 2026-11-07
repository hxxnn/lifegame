import { describe, expect, it } from 'vitest';
import { addDays, dateKey, daysBetween, isMonday, isWeekend, weekIdOf } from '../../src/domain/dates';

describe('dates', () => {
  it('weekIdOf returns that week\'s Monday', () => {
    expect(weekIdOf('2026-11-08')).toBe('2026-11-02');
    expect(weekIdOf('2026-11-02')).toBe('2026-11-02');
  });
  it('isWeekend / isMonday', () => {
    expect(isWeekend('2026-11-07')).toBe(true);
    expect(isWeekend('2026-11-08')).toBe(true);
    expect(isWeekend('2026-11-09')).toBe(false);
    expect(isMonday('2026-11-09')).toBe(true);
  });
  it('daysBetween is calendar based across DST', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-03-28', '2026-04-04')).toBe(7);
  });
  it('addDays crosses month/year/DST boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-28', 7)).toBe('2026-04-04');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('dateKey uses local calendar date', () => {
    expect(dateKey(new Date(2026, 10, 7, 23, 59))).toBe('2026-11-07');
    expect(dateKey(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});

import { logicalDate } from '../../src/domain/dates';
describe('logicalDate', () => {
  it('shifts the day boundary by the start hour', () => {
    expect(logicalDate(new Date(2026, 10, 10, 2, 30), 4)).toBe('2026-11-09');
    expect(logicalDate(new Date(2026, 10, 10, 4, 0), 4)).toBe('2026-11-10');
    expect(logicalDate(new Date(2026, 10, 10, 0, 5), 0)).toBe('2026-11-10');
    expect(logicalDate(new Date(2026, 10, 9, 3, 0), 4)).toBe('2026-11-08'); // Monday 03:00 still counts as Sunday
  });
});
