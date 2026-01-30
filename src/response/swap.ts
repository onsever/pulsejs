import type { SwapBehavior } from '../types';

export function performSwap(
  target: Element,
  content: DocumentFragment,
  behavior: SwapBehavior,
): void {
  switch (behavior) {
    case 'replace':
      target.innerHTML = '';
      target.appendChild(content);
      break;

    case 'outer':
      target.replaceWith(content);
      break;

    case 'append':
      target.appendChild(content);
      break;

    case 'prepend':
      target.insertBefore(content, target.firstChild);
      break;

    case 'before':
      target.parentNode?.insertBefore(content, target);
      break;

    case 'after':
      target.parentNode?.insertBefore(content, target.nextSibling);
      break;

    case 'remove':
      target.remove();
      break;

    case 'none':
      // No DOM operation
      break;
  }
}
