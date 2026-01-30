export function evaluateFilter(expression: string, event: Event, element: Element): boolean {
  try {
    const fn = new Function(
      'event', 'element', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'key', 'target',
      `return (${expression})`,
    );
    const kbEvent = event as KeyboardEvent;
    return !!fn(
      event,
      element,
      kbEvent.ctrlKey ?? false,
      kbEvent.shiftKey ?? false,
      kbEvent.altKey ?? false,
      kbEvent.metaKey ?? false,
      kbEvent.key ?? '',
      event.target,
    );
  } catch (e) {
    console.warn('Pulse: Filter expression error:', expression, e);
    return false;
  }
}
