import { Scanner } from './scanner';
import type { ParsedBody } from '../types';

/**
 * Parse the body section from inside braces: {content}
 * The scanner should be positioned at the content (braces already consumed).
 *
 * Variants:
 *   {'key': 'value', ...}   → json
 *   {#selector}             → selectors
 *   {#sel1, #sel2}          → selectors
 *   {this}                  → selectors
 *   {only field1, field2}   → filter
 *   {not field1, field2}    → filter
 */
export function parseBodyContent(content: string): ParsedBody {
  const trimmed = content.trim();
  if (!trimmed) {
    return { type: 'json', data: {}, selectors: null, filter: null };
  }

  // Filter: starts with 'only' or 'not'
  if (trimmed.startsWith('only ') || trimmed.startsWith('not ')) {
    const mode = trimmed.startsWith('only') ? 'only' : 'not';
    const rest = trimmed.slice(mode.length).trim();
    const fields = rest.split(',').map(f => f.trim()).filter(Boolean);
    return { type: 'filter', data: null, selectors: null, filter: { mode, fields } };
  }

  // Selectors: starts with # or . or 'this' or 'closest' or 'find'
  if (/^[#.]|^this\b|^closest\b|^find\b/.test(trimmed)) {
    const selectors = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    return { type: 'selectors', data: null, selectors, filter: null };
  }

  // JSON-like: {'key': 'value'}
  if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
    const data = parseJsonLike(trimmed);
    return { type: 'json', data, selectors: null, filter: null };
  }

  // Fallback: treat as selector
  const selectors = trimmed.split(',').map(s => s.trim()).filter(Boolean);
  return { type: 'selectors', data: null, selectors, filter: null };
}

/**
 * Parse JSON-like syntax with single quotes: 'key': 'value', 'key2': 'value2'
 */
function parseJsonLike(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const scanner = new Scanner(input);

  while (!scanner.isAtEnd()) {
    scanner.skipWhitespace();
    if (scanner.isAtEnd()) break;

    // Read key (single or double quoted)
    const key = readQuotedString(scanner);
    scanner.skipWhitespace();
    scanner.expect(':');
    scanner.skipWhitespace();
    const value = readQuotedString(scanner);

    result[key] = value;

    scanner.skipWhitespace();
    if (scanner.peek() === ',') {
      scanner.advance();
    }
  }

  return result;
}

function readQuotedString(scanner: Scanner): string {
  const quote = scanner.peek();
  if (quote !== "'" && quote !== '"') {
    // Unquoted value — read until comma, colon, or end
    return scanner.readWhile(ch => ch !== ',' && ch !== ':' && ch !== '}' && !/\s/.test(ch));
  }
  scanner.advance(); // consume opening quote
  let result = '';
  while (!scanner.isAtEnd() && scanner.peek() !== quote) {
    if (scanner.peek() === '\\') {
      scanner.advance(); // skip backslash
      result += scanner.advance(); // take escaped char
    } else {
      result += scanner.advance();
    }
  }
  if (scanner.peek() === quote) scanner.advance(); // consume closing quote
  return result;
}
