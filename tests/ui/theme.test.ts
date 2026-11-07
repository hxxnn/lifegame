import { describe, expect, it } from 'vitest';
import { nextTheme, resolveTheme } from '../../src/ui/theme';

describe('theme', () => {
  it('uses the stored choice when valid, otherwise the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme('purple', true)).toBe('dark');
  });
  it('nextTheme toggles between light and dark', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });
});
