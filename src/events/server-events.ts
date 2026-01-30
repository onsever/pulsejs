export function processServerTriggers(headerValue: string, target: EventTarget): void {
  const trimmed = headerValue.trim();

  // Try JSON format: {"eventName": {"key": "value"}}
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      for (const [eventName, detail] of Object.entries(parsed)) {
        target.dispatchEvent(new CustomEvent(eventName, {
          bubbles: true,
          detail,
        }));
      }
      return;
    } catch {
      // Not valid JSON, fall through to CSV
    }
  }

  // CSV format: event1, event2
  const events = trimmed.split(',').map(e => e.trim()).filter(Boolean);
  for (const eventName of events) {
    target.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
  }
}
