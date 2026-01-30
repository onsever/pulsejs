import type { PulseConfig } from '../types';

export function processScripts(container: Element, config: PulseConfig): void {
  const scripts = container.querySelectorAll('script');
  if (scripts.length === 0) return;

  if (!config.allowScriptTags) {
    for (const s of scripts) s.remove();
    return;
  }

  for (const original of scripts) {
    const replacement = document.createElement('script');
    // Copy all attributes
    for (const attr of original.attributes) {
      replacement.setAttribute(attr.name, attr.value);
    }
    if (original.src) {
      // External script — browser will fetch when appended
    } else {
      // Inline script
      replacement.textContent = original.textContent;
      if (config.inlineScriptNonce) {
        replacement.setAttribute('nonce', config.inlineScriptNonce);
      }
    }
    original.replaceWith(replacement);
  }
}
