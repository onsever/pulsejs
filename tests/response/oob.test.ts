import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractOOB, processOOBSwaps } from '../../src/response/oob';
import { performSwap } from '../../src/response/swap';

vi.mock('../../src/response/swap', () => ({
  performSwap: vi.fn(),
}));

function makeFragment(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

describe('extractOOB', () => {
  it('extracts elements with p-oob attribute', () => {
    const fragment = makeFragment('<div p-oob="#sidebar"><p>new sidebar</p></div><p>main</p>');
    const entries = extractOOB(fragment);

    expect(entries).toHaveLength(1);
    expect(entries[0].selector).toBe('#sidebar');
    expect(entries[0].behavior).toBe('replace');
  });

  it('parses behavior from p-oob attribute', () => {
    const fragment = makeFragment('<div p-oob="#sidebar.append"><p>extra</p></div>');
    const entries = extractOOB(fragment);

    expect(entries[0].selector).toBe('#sidebar');
    expect(entries[0].behavior).toBe('append');
  });

  it('supports all swap behaviors', () => {
    const fragment = makeFragment('<div p-oob="#a.prepend">x</div>');
    const entries = extractOOB(fragment);
    expect(entries[0].behavior).toBe('prepend');
  });

  it('defaults to replace when no behavior specified', () => {
    const fragment = makeFragment('<div p-oob="#target">x</div>');
    const entries = extractOOB(fragment);
    expect(entries[0].behavior).toBe('replace');
  });

  it('extracts content as DocumentFragment', () => {
    const fragment = makeFragment('<div p-oob="#sidebar"><span>a</span><span>b</span></div>');
    const entries = extractOOB(fragment);

    expect(entries[0].content).toBeInstanceOf(DocumentFragment);
    expect(entries[0].content.childNodes).toHaveLength(2);
  });

  it('returns empty array when no OOB elements', () => {
    const fragment = makeFragment('<p>just content</p>');
    const entries = extractOOB(fragment);
    expect(entries).toHaveLength(0);
  });

  it('extracts multiple OOB elements', () => {
    const fragment = makeFragment(
      '<div p-oob="#a">x</div><div p-oob="#b.after">y</div><p>main</p>'
    );
    const entries = extractOOB(fragment);

    expect(entries).toHaveLength(2);
    expect(entries[0].selector).toBe('#a');
    expect(entries[1].selector).toBe('#b');
    expect(entries[1].behavior).toBe('after');
  });
});

describe('processOOBSwaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="sidebar">old</div>';
  });

  it('calls performSwap for each entry with matching target', () => {
    const content = makeFragment('<p>new</p>');
    processOOBSwaps([{ selector: '#sidebar', behavior: 'replace', content }]);

    expect(performSwap).toHaveBeenCalledWith(
      document.getElementById('sidebar'),
      content,
      'replace'
    );
  });

  it('warns when target not found', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    processOOBSwaps([{ selector: '#missing', behavior: 'replace', content: makeFragment('') }]);

    expect(spy).toHaveBeenCalledWith('Pulse: OOB target not found: #missing');
    expect(performSwap).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('processes multiple entries', () => {
    document.body.innerHTML = '<div id="a">a</div><div id="b">b</div>';
    processOOBSwaps([
      { selector: '#a', behavior: 'replace', content: makeFragment('x') },
      { selector: '#b', behavior: 'append', content: makeFragment('y') },
    ]);

    expect(performSwap).toHaveBeenCalledTimes(2);
  });
});
