export interface OnHandler {
  event: string;
  handler: string;
}

export function parseOnAttribute(input: string): OnHandler[] {
  return input.split('|').map(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      return { event: part.trim(), handler: '' };
    }
    return {
      event: part.slice(0, colonIdx).trim(),
      handler: part.slice(colonIdx + 1).trim(),
    };
  });
}

export function setupOnHandlers(el: Element, handlers: OnHandler[]): () => void {
  const cleanups: (() => void)[] = [];

  for (const { event, handler } of handlers) {
    if (!handler) continue;

    const eventName = `pulse:${event}`;

    let fn: ((e: Event) => void) | null = null;
    try {
      const compiled = new Function('e', handler);
      fn = function (this: Element, e: Event) {
        try {
          compiled.call(this, e);
        } catch (err) {
          console.error('Pulse: p-on handler error:', err);
        }
      }.bind(el);
    } catch (err) {
      console.error('Pulse: Failed to compile p-on handler:', handler, err);
      continue;
    }

    el.addEventListener(eventName, fn);
    cleanups.push(() => el.removeEventListener(eventName, fn!));
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
