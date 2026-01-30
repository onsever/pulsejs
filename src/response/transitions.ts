export function withTransition(fn: () => void, useTransition: boolean): Promise<void> {
  if (useTransition && 'startViewTransition' in document) {
    return (document as any).startViewTransition(fn).finished;
  }

  fn();
  return Promise.resolve();
}
