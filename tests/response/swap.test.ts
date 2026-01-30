import { describe, it, expect, beforeEach } from 'vitest';
import { performSwap } from '../../src/response/swap';
import type { SwapBehavior } from '../../src/types';

describe('performSwap', () => {
  let target: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="target"><span>old</span></div><div id="after"></div>';
    target = document.getElementById('target')!;
  });

  function makeFragment(html: string): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
  }

  it('replace: replaces innerHTML', () => {
    performSwap(target, makeFragment('<p>new</p>'), 'replace');
    expect(target.innerHTML).toBe('<p>new</p>');
  });

  it('outer: replaces entire element', () => {
    performSwap(target, makeFragment('<p>new</p>'), 'outer');
    expect(document.getElementById('target')).toBeNull();
    expect(document.body.innerHTML).toContain('<p>new</p>');
  });

  it('append: adds at end', () => {
    performSwap(target, makeFragment('<p>new</p>'), 'append');
    expect(target.innerHTML).toBe('<span>old</span><p>new</p>');
  });

  it('prepend: adds at start', () => {
    performSwap(target, makeFragment('<p>new</p>'), 'prepend');
    expect(target.innerHTML).toBe('<p>new</p><span>old</span>');
  });

  it('before: inserts before target', () => {
    performSwap(target, makeFragment('<p>new</p>'), 'before');
    expect(target.previousElementSibling?.tagName).toBe('P');
  });

  it('after: inserts after target', () => {
    performSwap(target, makeFragment('<p>new</p>'), 'after');
    expect(target.nextElementSibling?.tagName).toBe('P');
  });

  it('remove: removes element', () => {
    performSwap(target, makeFragment(''), 'remove');
    expect(document.getElementById('target')).toBeNull();
  });

  it('none: does nothing', () => {
    const before = target.innerHTML;
    performSwap(target, makeFragment('<p>new</p>'), 'none');
    expect(target.innerHTML).toBe(before);
  });
});
