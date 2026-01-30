import { Scanner } from './scanner';
import type { ParsedTrigger, ParsedTriggerEvent, TriggerModifiers } from '../types';

/**
 * Parse p-trigger attribute:
 *   event modifiers, event modifiers
 *
 * Examples:
 *   "click"
 *   "click once"
 *   "input changed debounce 300ms"
 *   "click[ctrlKey]"
 *   "every 2s"
 *   "click from #btn"
 *   "click, input changed"
 */
export function parseTrigger(input: string): ParsedTrigger {
  const parts = splitTriggers(input);
  const events = parts.map(parseSingleTrigger);
  return { events };
}

function splitTriggers(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSingleTrigger(input: string): ParsedTriggerEvent {
  const scanner = new Scanner(input);
  scanner.skipWhitespace();

  let name: string;
  let isPolling = false;
  let pollingInterval: number | null = null;

  // Check for "every Xs"
  if (scanner.matchWord('every')) {
    isPolling = true;
    scanner.skipWhitespace();
    pollingInterval = parseTimeValue(scanner);
    name = 'every';
  } else {
    name = scanner.readWhile(ch => /[a-zA-Z0-9._-]/.test(ch));
  }

  // Check for [filter]
  let filter: string | null = null;
  if (scanner.peek() === '[') {
    filter = scanner.readBalanced('[', ']');
  }

  // Parse trigger modifiers
  const modifiers: TriggerModifiers = {
    once: false,
    changed: false,
    consume: false,
    debounce: null,
    throttle: null,
    delay: null,
  };

  let from: string | null = null;

  while (!scanner.isAtEnd()) {
    scanner.skipWhitespace();
    if (scanner.isAtEnd()) break;

    if (scanner.matchWord('once')) {
      modifiers.once = true;
    } else if (scanner.matchWord('changed')) {
      modifiers.changed = true;
    } else if (scanner.matchWord('consume')) {
      modifiers.consume = true;
    } else if (scanner.matchWord('debounce')) {
      scanner.skipWhitespace();
      modifiers.debounce = parseTimeValue(scanner);
    } else if (scanner.matchWord('throttle')) {
      scanner.skipWhitespace();
      modifiers.throttle = parseTimeValue(scanner);
    } else if (scanner.matchWord('delay')) {
      scanner.skipWhitespace();
      modifiers.delay = parseTimeValue(scanner);
    } else if (scanner.matchWord('from')) {
      scanner.skipWhitespace();
      from = scanner.remaining().trim();
      break; // 'from' consumes the rest
    } else {
      break;
    }
  }

  return { name, isPolling, pollingInterval, filter, modifiers, from };
}

function parseTimeValue(scanner: Scanner): number {
  const num = scanner.readWhile(ch => /[0-9.]/.test(ch));
  if (!num) scanner.error('Expected time value');
  const value = parseFloat(num);

  const unit = scanner.readWhile(ch => /[a-z]/.test(ch));
  if (unit === 's') return value * 1000;
  if (unit === 'ms' || unit === '') return value;

  return value;
}
