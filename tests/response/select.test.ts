import { describe, it, expect } from 'vitest';
import { applySelect } from '../../src/response/select';

function makeFragment(html: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return tpl.content;
}

describe('applySelect', () => {
  it('extracts matching element', () => {
    const frag = makeFragment('<div><p class="inner">Hello</p><span>Other</span></div>');
    const result = applySelect(frag, '.inner');
    const div = document.createElement('div');
    div.appendChild(result);
    expect(div.innerHTML).toBe('<p class="inner">Hello</p>');
  });

  it('returns original if no match', () => {
    const frag = makeFragment('<div>Hello</div>');
    const result = applySelect(frag, '.nonexistent');
    const div = document.createElement('div');
    div.appendChild(result);
    expect(div.innerHTML).toBe('<div>Hello</div>');
  });

  it('works with ID selector', () => {
    const frag = makeFragment('<div><span id="target">Found</span><span>Other</span></div>');
    const result = applySelect(frag, '#target');
    const div = document.createElement('div');
    div.appendChild(result);
    expect(div.innerHTML).toBe('<span id="target">Found</span>');
  });

  it('returns only the first match', () => {
    const frag = makeFragment('<p class="x">A</p><p class="x">B</p>');
    const result = applySelect(frag, '.x');
    const div = document.createElement('div');
    div.appendChild(result);
    expect(div.innerHTML).toBe('<p class="x">A</p>');
  });

  it('works with nested selectors', () => {
    const frag = makeFragment('<div class="outer"><div class="inner"><span>Deep</span></div></div>');
    const result = applySelect(frag, '.outer .inner');
    const div = document.createElement('div');
    div.appendChild(result);
    expect(div.textContent).toBe('Deep');
  });
});
