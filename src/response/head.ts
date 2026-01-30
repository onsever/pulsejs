import type { PulseConfig } from '../types';

export function mergeHead(doc: Document, config: PulseConfig): void {
  const newHead = doc.head;
  if (!newHead) return;

  // 1. Update title
  if (!config.ignoreTitle) {
    const newTitle = newHead.querySelector('title');
    if (newTitle) {
      document.title = newTitle.textContent || '';
    }
  }

  // 2. Merge <meta> by name or property
  const newMetas = newHead.querySelectorAll('meta[name], meta[property]');
  for (const meta of newMetas) {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    if (!name) continue;
    const existing = document.head.querySelector(
      `meta[name="${name}"], meta[property="${name}"]`,
    );
    const imported = document.importNode(meta, true);
    if (existing) {
      existing.replaceWith(imported);
    } else {
      document.head.appendChild(imported);
    }
  }

  // 3. Merge <link rel="stylesheet"> by href
  const newLinks = newHead.querySelectorAll('link[rel="stylesheet"]');
  for (const link of newLinks) {
    const href = link.getAttribute('href');
    if (!href) continue;
    const existing = document.head.querySelector(`link[rel="stylesheet"][href="${href}"]`);
    if (!existing) {
      document.head.appendChild(document.importNode(link, true));
    }
  }

  // 4. Append new <style> elements
  const newStyles = newHead.querySelectorAll('style');
  for (const style of newStyles) {
    document.head.appendChild(document.importNode(style, true));
  }
}
