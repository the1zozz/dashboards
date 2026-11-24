import { describe, expect, it } from 'vitest';
import { MESSAGES } from './messages';

describe('messages', () => {
  it('has every key in English and Arabic, none empty', () => {
    const en = Object.keys(MESSAGES.en).sort();
    const ar = Object.keys(MESSAGES.ar).sort();
    expect(ar).toEqual(en);
    for (const lang of [MESSAGES.en, MESSAGES.ar] as Record<string, string>[]) {
      expect(Object.values(lang).filter((v) => !v.trim())).toEqual([]);
    }
  });
});
