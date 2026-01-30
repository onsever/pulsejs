import { describe, it, expect, vi } from 'vitest';
import { withTransition } from '../../src/response/transitions';

describe('withTransition', () => {
  it('calls fn directly when useTransition is false', async () => {
    const fn = vi.fn();
    await withTransition(fn, false);
    expect(fn).toHaveBeenCalled();
  });

  it('calls fn directly when startViewTransition not available', async () => {
    const fn = vi.fn();
    // jsdom doesn't have startViewTransition
    await withTransition(fn, true);
    expect(fn).toHaveBeenCalled();
  });

  it('uses startViewTransition when available and enabled', async () => {
    const fn = vi.fn();
    const mockTransition = { finished: Promise.resolve() };
    (document as any).startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return mockTransition;
    });

    await withTransition(fn, true);
    expect((document as any).startViewTransition).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();

    delete (document as any).startViewTransition;
  });

  it('returns resolved promise when no transition', async () => {
    const result = withTransition(() => {}, false);
    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});
