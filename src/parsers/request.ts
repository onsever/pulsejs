import { Scanner } from './scanner';
import { parseBodyContent } from './body';
import { parseModifiers } from './modifier';
import type { ParsedRequest, HttpMethod, ParsedTarget, SwapBehavior } from '../types';
import { METHODS, BEHAVIORS } from '../constants';

/**
 * Parse the full p-request attribute:
 *   {headers} METHOD /url {body} > target.behavior :modifiers
 *
 * All parts except URL are optional.
 */
export function parseRequest(input: string): ParsedRequest {
  const scanner = new Scanner(input);
  scanner.skipWhitespace();

  let headers: Record<string, string> = {};
  let method: HttpMethod = 'GET';
  let url = '';
  let body = null;
  let target: ParsedTarget = { selector: 'this', behavior: 'replace' };
  let modifiers: ParsedRequest['modifiers'] = [];

  // Step 1: Check for leading {headers} — only if followed by a method or URL
  if (scanner.peek() === '{') {
    const saved = scanner.position();
    const content = scanner.readBalanced('{', '}');
    scanner.skipWhitespace();

    // Disambiguate: if next token is a method or URL, this was headers.
    // Otherwise it might be a body-only scenario (unlikely for first position).
    const next = scanner.remaining().trim();
    if (looksLikeMethodOrUrl(next)) {
      headers = parseHeaderContent(content);
    } else {
      // Not headers — reset and let URL parsing handle it
      scanner.setPosition(saved);
    }
  }

  scanner.skipWhitespace();

  // Step 2: Check for METHOD
  for (const m of METHODS) {
    if (scanner.matchWord(m)) {
      method = m;
      scanner.skipWhitespace();
      break;
    }
  }

  // Step 3: Read URL (required)
  if (scanner.peek() === '/' || scanner.peek() === 'h') {
    url = scanner.readWhile(ch => !/[\s{>:]/.test(ch));
  }

  if (!url) {
    // If nothing parsed as URL, maybe the entire input is a URL
    const remaining = scanner.remaining().trim();
    if (remaining && !remaining.startsWith('>') && !remaining.startsWith(':') && !remaining.startsWith('{')) {
      url = scanner.readWhile(ch => !/[\s{>:]/.test(ch));
    }
    if (!url) {
      scanner.error('Expected URL path', 'Add a URL path like "/api/data"');
    }
  }

  scanner.skipWhitespace();

  // Step 4: Check for {body}
  if (scanner.peek() === '{') {
    const content = scanner.readBalanced('{', '}');
    body = parseBodyContent(content);
  }

  scanner.skipWhitespace();

  // Step 5: Check for > target.behavior
  if (scanner.peek() === '>') {
    scanner.advance();
    scanner.skipWhitespace();
    target = parseTargetExpression(scanner);
  }

  scanner.skipWhitespace();

  // Step 6: Parse :modifiers
  if (scanner.peek() === ':') {
    modifiers = parseModifiers(scanner);
  }

  return { headers, method, url, body, target, modifiers };
}

function parseTargetExpression(scanner: Scanner): ParsedTarget {
  // Read selector until we hit a dot followed by a behavior name, or colon, or end
  let selector = '';
  let behavior: SwapBehavior = 'replace';

  // Read the full target string up to modifier or end
  const targetStr = scanner.readWhile(ch => ch !== ':' && !/\s/.test(ch) || ch === ' ');

  // Trim and split by last dot that matches a behavior
  const trimmed = targetStr.trim();

  // Check if it ends with .behavior
  for (const b of BEHAVIORS) {
    const suffix = '.' + b;
    if (trimmed.endsWith(suffix)) {
      selector = trimmed.slice(0, -suffix.length).trim();
      behavior = b;
      return { selector: selector || 'this', behavior };
    }
  }

  selector = trimmed;
  return { selector: selector || 'this', behavior };
}

function looksLikeMethodOrUrl(str: string): boolean {
  if (!str) return false;
  for (const m of METHODS) {
    if (str.startsWith(m + ' ') || str.startsWith(m + '\t')) return true;
  }
  return str.startsWith('/') || str.startsWith('http');
}

function parseHeaderContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const scanner = new Scanner(content);

  while (!scanner.isAtEnd()) {
    scanner.skipWhitespace();
    if (scanner.isAtEnd()) break;

    const key = readQuoted(scanner);
    scanner.skipWhitespace();
    scanner.expect(':');
    scanner.skipWhitespace();
    const value = readQuoted(scanner);

    result[key] = value;

    scanner.skipWhitespace();
    if (scanner.peek() === ',') scanner.advance();
  }

  return result;
}

function readQuoted(scanner: Scanner): string {
  const quote = scanner.peek();
  if (quote !== "'" && quote !== '"') {
    return scanner.readWhile(ch => ch !== ',' && ch !== ':' && !/\s/.test(ch));
  }
  scanner.advance();
  let result = '';
  while (!scanner.isAtEnd() && scanner.peek() !== quote) {
    if (scanner.peek() === '\\') {
      scanner.advance();
      result += scanner.advance();
    } else {
      result += scanner.advance();
    }
  }
  if (scanner.peek() === quote) scanner.advance();
  return result;
}
