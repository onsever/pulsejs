import type { OOBEntry, SwapBehavior } from '../types';
import { ATTRS, BEHAVIORS } from '../constants';
import { performSwap } from './swap';

export function extractOOB(fragment: DocumentFragment): OOBEntry[] {
  const entries: OOBEntry[] = [];

  // Wrap in temp element to use querySelectorAll
  const temp = document.createElement('div');
  temp.appendChild(fragment.cloneNode(true));

  const oobElements = temp.querySelectorAll(`[${ATTRS.OOB}]`);
  for (const el of oobElements) {
    const attr = el.getAttribute(ATTRS.OOB)!;
    const { selector, behavior } = parseOOBAttribute(attr);

    // Create fragment from element's children
    const content = document.createDocumentFragment();
    while (el.firstChild) {
      content.appendChild(el.firstChild);
    }

    entries.push({ selector, behavior, content });

    // Remove from original fragment
    // Find and remove matching element in the real fragment
    const realEl = findMatchingElement(fragment, el);
    if (realEl) realEl.remove();
  }

  return entries;
}

export function processOOBSwaps(entries: OOBEntry[]): void {
  for (const entry of entries) {
    const target = document.querySelector(entry.selector);
    if (!target) {
      console.warn(`Pulse: OOB target not found: ${entry.selector}`);
      continue;
    }
    performSwap(target, entry.content, entry.behavior);
  }
}

function parseOOBAttribute(attr: string): { selector: string; behavior: SwapBehavior } {
  // Format: "#selector" or "#selector.behavior"
  const trimmed = attr.trim();

  for (const b of BEHAVIORS) {
    const suffix = '.' + b;
    if (trimmed.endsWith(suffix)) {
      return {
        selector: trimmed.slice(0, -suffix.length),
        behavior: b,
      };
    }
  }

  return { selector: trimmed, behavior: 'replace' };
}

function findMatchingElement(fragment: DocumentFragment, target: Element): Element | null {
  // Walk through fragment children looking for element with same tag and attributes
  const temp = document.createElement('div');
  temp.appendChild(fragment);
  const found = temp.querySelector(`[${ATTRS.OOB}="${target.getAttribute(ATTRS.OOB)}"]`);
  // Move children back
  while (temp.firstChild) fragment.appendChild(temp.firstChild);
  return found;
}
