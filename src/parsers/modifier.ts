import { Scanner } from './scanner';
import type { ParsedModifier } from '../types';

export function parseModifiers(scanner: Scanner): ParsedModifier[] {
  const modifiers: ParsedModifier[] = [];

  while (!scanner.isAtEnd()) {
    scanner.skipWhitespace();
    if (scanner.peek() !== ':') break;
    scanner.advance(); // consume ':'

    const name = scanner.readWhile(ch => /[a-zA-Z0-9_-]/.test(ch));
    if (!name) {
      scanner.error('Expected modifier name after ":"');
    }

    let value: string | null = null;
    if (scanner.peek() === '(') {
      value = scanner.readBalanced('(', ')');
    }

    modifiers.push({ name, value });
  }

  return modifiers;
}

export function parseModifiersFromString(input: string): ParsedModifier[] {
  const scanner = new Scanner(input);
  // Prepend ':' if not present for standalone parsing
  return parseModifiers(scanner);
}

export function getModifier(modifiers: ParsedModifier[], name: string): ParsedModifier | undefined {
  return modifiers.find(m => m.name === name);
}

export function getModifierValue(modifiers: ParsedModifier[], name: string): string | null {
  return getModifier(modifiers, name)?.value ?? null;
}

export function hasModifier(modifiers: ParsedModifier[], name: string): boolean {
  return modifiers.some(m => m.name === name);
}
