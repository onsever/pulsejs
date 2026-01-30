import { ALL_ATTRS } from '../constants';
import { processElement, processTree, cleanupElement, cleanupTree } from './process';
import { requestCache, triggerCache } from '../parsers/cache';

let observer: MutationObserver | null = null;

export function setupObserver(): MutationObserver {
  if (observer) return observer;

  observer = new MutationObserver(handleMutations);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ALL_ATTRS as unknown as string[],
  });

  return observer;
}

export function disconnectObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function handleMutations(mutations: MutationRecord[]): void {
  const addedElements: Element[] = [];
  const removedElements: Element[] = [];

  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          addedElements.push(node);
        }
      }
      for (const node of mutation.removedNodes) {
        if (node instanceof Element) {
          removedElements.push(node);
        }
      }
    } else if (mutation.type === 'attributes' && mutation.target instanceof Element) {
      // Re-process element when pulse attributes change
      const el = mutation.target;
      requestCache.invalidateElement(el);
      triggerCache.invalidateElement(el);
      cleanupElement(el);
      processElement(el);
    }
  }

  // Cleanup removed elements
  for (const el of removedElements) {
    cleanupTree(el);
  }

  // Process added elements (batch with requestIdleCallback if available)
  if (addedElements.length > 0) {
    const process = () => {
      for (const el of addedElements) {
        processTree(el);
        processElement(el);
      }
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(process);
    } else {
      setTimeout(process, 0);
    }
  }
}
