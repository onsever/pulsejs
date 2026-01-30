import { describe, it, expect } from 'vitest';
import { parseBodyContent } from '../../src/parsers/body';

describe('parseBodyContent', () => {
  it('parses JSON-like content', () => {
    const b = parseBodyContent("'name': 'John', 'age': '30'");
    expect(b.type).toBe('json');
    expect(b.data).toEqual({ name: 'John', age: '30' });
  });

  it('parses selector', () => {
    const b = parseBodyContent('#form1');
    expect(b.type).toBe('selectors');
    expect(b.selectors).toEqual(['#form1']);
  });

  it('parses multiple selectors', () => {
    const b = parseBodyContent('#form1, #form2');
    expect(b.type).toBe('selectors');
    expect(b.selectors).toEqual(['#form1', '#form2']);
  });

  it('parses this', () => {
    const b = parseBodyContent('this');
    expect(b.type).toBe('selectors');
    expect(b.selectors).toEqual(['this']);
  });

  it('parses only filter', () => {
    const b = parseBodyContent('only name, email');
    expect(b.type).toBe('filter');
    expect(b.filter).toEqual({ mode: 'only', fields: ['name', 'email'] });
  });

  it('parses not filter', () => {
    const b = parseBodyContent('not password');
    expect(b.type).toBe('filter');
    expect(b.filter).toEqual({ mode: 'not', fields: ['password'] });
  });

  it('handles empty content', () => {
    const b = parseBodyContent('');
    expect(b.type).toBe('json');
    expect(b.data).toEqual({});
  });
});
