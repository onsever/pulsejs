export function debounce(fn: (...args: unknown[]) => void, ms: number): (...args: unknown[]) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn: (...args: unknown[]) => void, ms: number): (...args: unknown[]) => void {
  let last = 0;
  return (...args: unknown[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

export function delay(fn: (...args: unknown[]) => void, ms: number): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    setTimeout(() => fn(...args), ms);
  };
}
