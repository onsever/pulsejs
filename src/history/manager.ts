import type { PulseConfig, HistoryCacheEntry } from '../types';
import { ATTRS, HEADERS } from '../constants';
import { LRUCache } from './cache';
import { processTree } from '../engine/process';

const historyCache = new LRUCache<string, HistoryCacheEntry>(10);

export function pushHistory(url: string, config: PulseConfig): void {
  cacheCurrentPage();
  history.pushState({ pulse: true }, '', url);
}

export function replaceHistory(url: string, config: PulseConfig): void {
  cacheCurrentPage();
  history.replaceState({ pulse: true }, '', url);
}

export function cacheCurrentPage(): void {
  const historyEl = document.querySelector(`[${ATTRS.HISTORY}="elt"]`);
  const content = historyEl ? historyEl.innerHTML : document.body.innerHTML;

  historyCache.set(location.href, {
    url: location.href,
    content,
    title: document.title,
    scrollPosition: { x: scrollX, y: scrollY },
    timestamp: Date.now(),
  });
}

export function setupPopstateHandler(config: PulseConfig): void {
  window.addEventListener('popstate', () => {
    const url = location.href;
    const entry = historyCache.get(url);

    if (entry) {
      restoreFromCache(entry);
    } else if (config.refreshOnHistoryMiss) {
      location.reload();
    } else {
      // Fetch the URL
      fetch(url, {
        headers: { [HEADERS.REQUEST]: 'true', [HEADERS.HISTORY_RESTORE]: 'true' },
      })
        .then(r => r.text())
        .then(html => {
          const historyEl = document.querySelector(`[${ATTRS.HISTORY}="elt"]`);
          if (historyEl) {
            historyEl.innerHTML = html;
            processTree(historyEl);
          } else {
            document.body.innerHTML = html;
            processTree(document);
          }
        })
        .catch(() => location.reload());
    }
  });
}

function restoreFromCache(entry: HistoryCacheEntry): void {
  const historyEl = document.querySelector(`[${ATTRS.HISTORY}="elt"]`);
  if (historyEl) {
    historyEl.innerHTML = entry.content;
    processTree(historyEl);
  } else {
    document.body.innerHTML = entry.content;
    processTree(document);
  }

  document.title = entry.title;

  requestAnimationFrame(() => {
    window.scrollTo(entry.scrollPosition.x, entry.scrollPosition.y);
  });
}
