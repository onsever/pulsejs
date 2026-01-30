import { describe, it, expect, beforeEach } from 'vitest';
import { savePreserved, restorePreserved } from '../../src/response/preserve';

describe('preserve', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('savePreserved', () => {
    it('saves elements by ID', () => {
      document.body.innerHTML = '<div id="root"><input id="field1" value="hello"><div id="field2">text</div></div>';
      const root = document.getElementById('root')!;
      const saved = savePreserved(root, ['field1', 'field2']);
      expect(saved.size).toBe(2);
      expect(saved.get('field1')?.tagName).toBe('INPUT');
      expect(saved.get('field2')?.tagName).toBe('DIV');
    });

    it('skips missing IDs', () => {
      document.body.innerHTML = '<div id="root"><input id="field1"></div>';
      const root = document.getElementById('root')!;
      const saved = savePreserved(root, ['field1', 'nonexistent']);
      expect(saved.size).toBe(1);
    });

    it('returns empty map for no matches', () => {
      document.body.innerHTML = '<div id="root"></div>';
      const saved = savePreserved(document.getElementById('root')!, ['nope']);
      expect(saved.size).toBe(0);
    });
  });

  describe('restorePreserved', () => {
    it('replaces placeholder with saved element', () => {
      document.body.innerHTML = '<div id="root"><input id="field1" value="new"></div>';
      const root = document.getElementById('root')!;

      const original = document.createElement('input');
      original.id = 'field1';
      (original as HTMLInputElement).value = 'preserved';

      const saved = new Map<string, Element>();
      saved.set('field1', original);

      restorePreserved(root, saved);

      const restored = root.querySelector('#field1') as HTMLInputElement;
      expect(restored.value).toBe('preserved');
    });

    it('handles missing placeholders gracefully', () => {
      document.body.innerHTML = '<div id="root"><p>no match</p></div>';
      const root = document.getElementById('root')!;
      const saved = new Map<string, Element>();
      saved.set('missing', document.createElement('div'));

      restorePreserved(root, saved);
      // Should not throw
      expect(root.querySelector('#missing')).toBeNull();
    });
  });
});
