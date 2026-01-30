import { describe, it, expect } from 'vitest';
import { parseModifiers, hasModifier, getModifierValue } from '../../src/parsers/modifier';
import { Scanner } from '../../src/parsers/scanner';

describe('parseModifiers', () => {
  it('parses single modifier without value', () => {
    const scanner = new Scanner(':confirm');
    const mods = parseModifiers(scanner);
    expect(mods).toHaveLength(1);
    expect(mods[0].name).toBe('confirm');
    expect(mods[0].value).toBeNull();
  });

  it('parses modifier with value', () => {
    const scanner = new Scanner(':sync(abort)');
    const mods = parseModifiers(scanner);
    expect(mods[0].name).toBe('sync');
    expect(mods[0].value).toBe('abort');
  });

  it('parses multiple modifiers', () => {
    const scanner = new Scanner(':confirm :sync(abort) :timeout(5000)');
    const mods = parseModifiers(scanner);
    expect(mods).toHaveLength(3);
  });

  it('parses modifier with quoted value', () => {
    const scanner = new Scanner(":confirm('Are you sure?')");
    const mods = parseModifiers(scanner);
    expect(mods[0].value).toBe("'Are you sure?'");
  });
});

describe('hasModifier', () => {
  it('returns true when modifier exists', () => {
    expect(hasModifier([{ name: 'confirm', value: null }], 'confirm')).toBe(true);
  });

  it('returns false when modifier absent', () => {
    expect(hasModifier([{ name: 'confirm', value: null }], 'sync')).toBe(false);
  });
});

describe('getModifierValue', () => {
  it('returns value when present', () => {
    expect(getModifierValue([{ name: 'sync', value: 'abort' }], 'sync')).toBe('abort');
  });

  it('returns null when absent', () => {
    expect(getModifierValue([{ name: 'sync', value: 'abort' }], 'confirm')).toBeNull();
  });
});
