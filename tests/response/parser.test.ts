import { describe, it, expect } from 'vitest';
import { parseHTML } from '../../src/response/parser';

describe('parseHTML', () => {
  it('returns empty fragment for empty string', () => {
    const fragment = parseHTML('');
    expect(fragment.childNodes.length).toBe(0);
  });

  it('returns empty fragment for whitespace-only string', () => {
    const fragment = parseHTML('   \n  ');
    expect(fragment.childNodes.length).toBe(0);
  });

  it('parses a simple div', () => {
    const fragment = parseHTML('<div>hello</div>');
    expect(fragment.childNodes.length).toBe(1);
    expect((fragment.firstChild as Element).tagName).toBe('DIV');
    expect((fragment.firstChild as Element).textContent).toBe('hello');
  });

  it('parses multiple sibling elements', () => {
    const fragment = parseHTML('<p>a</p><p>b</p>');
    expect(fragment.childNodes.length).toBe(2);
  });

  // Bug fix #1: importNode infinite loop
  // Previously used `while (doc.body.firstChild)` with importNode (copies, doesn't remove),
  // causing infinite loop. Now uses Array.from().
  it('does not loop infinitely (importNode fix)', () => {
    const fragment = parseHTML('<span>test</span>');
    expect(fragment.childNodes.length).toBe(1);
    expect((fragment.firstChild as Element).tagName).toBe('SPAN');
  });

  it('handles large number of children without hanging', () => {
    const html = Array.from({ length: 100 }, (_, i) => `<p>${i}</p>`).join('');
    const fragment = parseHTML(html);
    expect(fragment.childNodes.length).toBe(100);
  });

  // Bug fix #3: table-context elements
  describe('table-context parsing', () => {
    it('parses <tr> without wrapping in extra table/tbody', () => {
      const fragment = parseHTML('<tr><td>A</td><td>B</td></tr>');
      expect(fragment.childNodes.length).toBe(1);
      const tr = fragment.firstChild as Element;
      expect(tr.tagName).toBe('TR');
      expect(tr.children.length).toBe(2);
      expect(tr.children[0].tagName).toBe('TD');
    });

    it('parses multiple <tr> elements', () => {
      const fragment = parseHTML('<tr><td>1</td></tr><tr><td>2</td></tr>');
      expect(fragment.childNodes.length).toBe(2);
      expect((fragment.childNodes[0] as Element).tagName).toBe('TR');
      expect((fragment.childNodes[1] as Element).tagName).toBe('TR');
    });

    it('parses <td> elements', () => {
      const fragment = parseHTML('<td>cell</td>');
      expect(fragment.childNodes.length).toBe(1);
      expect((fragment.firstChild as Element).tagName).toBe('TD');
    });

    it('parses <th> elements', () => {
      const fragment = parseHTML('<th>header</th>');
      expect(fragment.childNodes.length).toBe(1);
      expect((fragment.firstChild as Element).tagName).toBe('TH');
    });

    it('parses <thead> elements', () => {
      const fragment = parseHTML('<thead><tr><th>Name</th></tr></thead>');
      const thead = fragment.firstChild as Element;
      expect(thead.tagName).toBe('THEAD');
    });

    it('parses <tbody> elements', () => {
      const fragment = parseHTML('<tbody><tr><td>data</td></tr></tbody>');
      const tbody = fragment.firstChild as Element;
      expect(tbody.tagName).toBe('TBODY');
    });

    it('parses <tfoot> elements', () => {
      const fragment = parseHTML('<tfoot><tr><td>total</td></tr></tfoot>');
      const tfoot = fragment.firstChild as Element;
      expect(tfoot.tagName).toBe('TFOOT');
    });

    it('parses <colgroup> elements', () => {
      const fragment = parseHTML('<colgroup><col></colgroup>');
      const colgroup = fragment.firstChild as Element;
      expect(colgroup.tagName).toBe('COLGROUP');
    });

    it('parses <caption> elements', () => {
      const fragment = parseHTML('<caption>Table Title</caption>');
      const caption = fragment.firstChild as Element;
      expect(caption.tagName).toBe('CAPTION');
    });

    it('preserves attributes on table-context elements', () => {
      const fragment = parseHTML('<tr id="row-1" class="active"><td>A</td></tr>');
      const tr = fragment.firstChild as Element;
      expect(tr.getAttribute('id')).toBe('row-1');
      expect(tr.getAttribute('class')).toBe('active');
    });

    it('preserves nested content in <tr>', () => {
      const fragment = parseHTML(
        '<tr id="c1"><td>Alice</td><td>alice@example.com</td><td><button>Edit</button></td></tr>'
      );
      const tr = fragment.firstChild as Element;
      expect(tr.id).toBe('c1');
      expect(tr.children.length).toBe(3);
      expect(tr.querySelector('button')?.textContent).toBe('Edit');
    });
  });
});
