import * as vscode from 'vscode';

const PULSE_ATTRS = ['p-request', 'p-trigger', 'p-on', 'p-history', 'p-boost', 'p-oob', 'p-ignore', 'p-inherit'];
const ATTR_PATTERN = /p-(request|trigger|on|history|boost|oob|inherit|ignore)\s*=\s*"([^"]*)"/g;

export interface AttributeContext {
  attrName: string;
  fullValue: string;
  cursorOffset: number;
  segment: string;
  prefix: string;
  /** Offset in document where the attribute value starts (after opening quote) */
  valueStartOffset: number;
}

export interface FoundAttribute {
  attrName: string;
  value: string;
  valueStartOffset: number;
}

/**
 * Find all p-* attributes in a document.
 */
export function findAllAttributes(text: string): FoundAttribute[] {
  const results: FoundAttribute[] = [];
  const regex = new RegExp(ATTR_PATTERN.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const attrName = 'p-' + m[1];
    const value = m[2];
    // valueStartOffset = match start + attr name + ="
    const valueStartOffset = m.index + m[0].indexOf('"') + 1;
    results.push({ attrName, value, valueStartOffset });
  }
  return results;
}

/**
 * Detect the attribute context at the cursor position.
 * Supports multi-line attributes by scanning backwards up to 20 lines.
 */
export function getAttributeContext(document: vscode.TextDocument, position: vscode.Position): AttributeContext | null {
  const cursorOffset = document.offsetAt(position);

  // Build a text window: up to 20 lines before cursor line through current line
  const startLine = Math.max(0, position.line - 20);
  const endLine = position.line;
  const windowStart = document.offsetAt(new vscode.Position(startLine, 0));
  const windowEnd = document.offsetAt(new vscode.Position(endLine, document.lineAt(endLine).text.length));
  const windowText = document.getText(new vscode.Range(
    document.positionAt(windowStart),
    document.positionAt(windowEnd),
  ));

  const cursorInWindow = cursorOffset - windowStart;

  // Search for p-*=" patterns in the window
  for (const attr of PULSE_ATTRS) {
    const pattern = new RegExp(attr.replace('-', '\\-') + '\\s*=\\s*"', 'g');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(windowText)) !== null) {
      const valueStart = match.index + match[0].length;

      // Find closing quote — scan forward from valueStart in full document text
      const fullText = document.getText();
      const absValueStart = windowStart + valueStart;
      let closingQuote = -1;
      for (let i = absValueStart; i < fullText.length; i++) {
        if (fullText[i] === '"') {
          closingQuote = i;
          break;
        }
      }
      const absValueEnd = closingQuote === -1 ? fullText.length : closingQuote;

      if (cursorOffset >= absValueStart && cursorOffset <= absValueEnd) {
        const fullValue = fullText.slice(absValueStart, absValueEnd);
        const cursorOffsetInValue = cursorOffset - absValueStart;
        const valueUpToCursor = fullValue.slice(0, cursorOffsetInValue);
        const segment = getSegment(attr, valueUpToCursor);
        const prefix = getPrefix(valueUpToCursor, segment);
        return {
          attrName: attr,
          fullValue,
          cursorOffset: cursorOffsetInValue,
          segment,
          prefix,
          valueStartOffset: absValueStart,
        };
      }
    }
  }
  return null;
}

/**
 * Check if cursor is in an HTML tag and typing an attribute name starting with "p-".
 */
export function isTypingAttributeName(document: vscode.TextDocument, position: vscode.Position): string | null {
  const line = document.lineAt(position.line).text;
  const before = line.slice(0, position.character);
  // Match partial attribute name like "p-" or "p-req" at the end
  const m = before.match(/\bp-([\w-]*)$/);
  return m ? m[0] : null;
}

/**
 * Determine the segment for p-on attribute values.
 * Returns 'event' when typing event name, 'handler' when inside handler().
 */
export function getOnSegment(valueUpToCursor: string): string {
  const trimmed = valueUpToCursor.trim();
  // After "event:" we're in handler territory
  if (/:\s*[^|]*$/.test(trimmed)) {
    return 'handler';
  }
  // After "|" we start a new event
  if (/\|\s*$/.test(trimmed)) {
    return 'event';
  }
  return 'event';
}

function getSegment(attrName: string, valueUpToCursor: string): string {
  if (attrName === 'p-request') return getRequestSegment(valueUpToCursor);
  if (attrName === 'p-trigger') return getTriggerSegment(valueUpToCursor);
  if (attrName === 'p-on') return getOnSegment(valueUpToCursor);
  return 'value';
}

function getRequestSegment(v: string): string {
  // Scan through the string to determine segment
  let i = 0;
  const len = v.length;

  // Skip leading whitespace
  while (i < len && /\s/.test(v[i])) i++;

  if (i >= len) return 'start';

  // First, determine structural positions with quote-aware brace tracking
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';
  let urlSeen = false;
  let gtIndex = -1;
  let lastCloseBraceBeforeUrl = -1;
  let lastOpenBraceAfterUrl = -1;

  for (let j = 0; j < len; j++) {
    const ch = v[j];
    if (inQuote) {
      if (ch === quoteChar && v[j - 1] !== '\\') {
        inQuote = false;
      }
      continue;
    }
    if ((ch === "'" || ch === '"') && depth > 0) {
      inQuote = true;
      quoteChar = ch;
      continue;
    }
    if (ch === '{') {
      depth++;
      if (urlSeen && depth === 1) lastOpenBraceAfterUrl = j;
    } else if (ch === '}') {
      depth--;
      if (!urlSeen && depth === 0) lastCloseBraceBeforeUrl = j;
    } else if (depth === 0 && ch === '/') {
      urlSeen = true;
    } else if (depth === 0 && ch === '>') {
      gtIndex = j;
    }
  }

  // If currently inside braces
  if (depth > 0) {
    return urlSeen ? 'body' : 'headers';
  }

  // Check for > (target section)
  if (gtIndex !== -1) {
    const afterGt = v.slice(gtIndex + 1).trim();
    // Check for modifier colon after target section
    const modifierMatch = afterGt.match(/(?:^|\s):(\w*)(\(.*)?$/);
    if (modifierMatch) {
      if (modifierMatch[2] && !modifierMatch[2].includes(')')) {
        return 'modifier-value';
      }
      return 'modifier';
    }
    if (afterGt.includes('.')) return 'behavior';
    return 'target';
  }

  // Check for modifier colon — only after URL section, not inside URLs
  // Look for :word pattern that's not part of a URL (http://, https://, localhost:port)
  if (urlSeen) {
    const modifierColonIdx = findModifierColon(v);
    if (modifierColonIdx !== -1) {
      const afterColon = v.slice(modifierColonIdx + 1);
      const openParen = afterColon.indexOf('(');
      if (openParen !== -1 && !afterColon.includes(')')) {
        return 'modifier-value';
      }
      return 'modifier';
    }
  }

  // If URL has been started
  if (urlSeen) return 'url';

  // Check if a method has been typed
  const trimmed = v.trim();
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  for (const m of methods) {
    if (trimmed.startsWith(m + ' ') || trimmed.startsWith(m + '\t')) return 'url';
    if (trimmed === m) return 'start'; // still in method, partial match
  }

  return 'start';
}

/**
 * Find the index of a modifier colon (`:word`) that's not inside a URL.
 * Skips colons in patterns like `http://`, `https://`, `localhost:3000`.
 */
function findModifierColon(v: string): number {
  const len = v.length;
  for (let i = len - 1; i >= 0; i--) {
    if (v[i] !== ':') continue;

    // Skip if this colon is part of :// (URL scheme)
    if (i + 2 < len && v[i + 1] === '/' && v[i + 2] === '/') continue;

    // Skip if followed by digits only (port number like :3000)
    const afterColon = v.slice(i + 1);
    const portMatch = afterColon.match(/^(\d+)/);
    if (portMatch) {
      // Check if preceded by a hostname-like pattern
      const before = v.slice(0, i);
      if (/[a-zA-Z0-9]$/.test(before)) continue;
    }

    // This looks like a modifier colon if preceded by whitespace or end of URL/body
    const before = v.slice(0, i);
    if (/\s$/.test(before) || /\)$/.test(before)) {
      return i;
    }
  }
  return -1;
}

function getTriggerSegment(v: string): string {
  const trimmed = v.trim();
  // If has space after event name, we're in modifiers
  if (/^[a-zA-Z0-9._-]+\s+/.test(trimmed)) {
    const afterEvent = trimmed.replace(/^[a-zA-Z0-9._-]+\s+/, '');
    if (afterEvent.startsWith('from ') || afterEvent === 'from') return 'from';
    return 'modifier';
  }
  // After comma, new event
  if (v.includes(',')) {
    const lastPart = v.slice(v.lastIndexOf(',') + 1).trim();
    if (!lastPart || /^[a-zA-Z]*$/.test(lastPart)) return 'event';
    return 'modifier';
  }
  return 'event';
}

function getPrefix(valueUpToCursor: string, segment: string): string {
  if (segment === 'modifier') {
    const lastColon = valueUpToCursor.lastIndexOf(':');
    if (lastColon !== -1) return valueUpToCursor.slice(lastColon + 1);
  }
  if (segment === 'behavior') {
    const lastDot = valueUpToCursor.lastIndexOf('.');
    if (lastDot !== -1) return valueUpToCursor.slice(lastDot + 1);
  }
  // General: word being typed
  const m = valueUpToCursor.match(/([a-zA-Z0-9._-]*)$/);
  return m ? m[1] : '';
}
