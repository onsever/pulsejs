// Table-context elements need a proper wrapper for innerHTML parsing,
// since DOMParser wraps bare <tr>, <td>, etc. in <table><tbody>.
const TABLE_WRAPPERS: Record<string, { depth: number; wrap: [string, string] }> = {
  thead: { depth: 1, wrap: ['<table>', '</table>'] },
  tbody: { depth: 1, wrap: ['<table>', '</table>'] },
  tfoot: { depth: 1, wrap: ['<table>', '</table>'] },
  colgroup: { depth: 1, wrap: ['<table>', '</table>'] },
  caption: { depth: 1, wrap: ['<table>', '</table>'] },
  tr: { depth: 2, wrap: ['<table><tbody>', '</tbody></table>'] },
  td: { depth: 3, wrap: ['<table><tbody><tr>', '</tr></tbody></table>'] },
  th: { depth: 3, wrap: ['<table><tbody><tr>', '</tr></tbody></table>'] },
  col: { depth: 2, wrap: ['<table><colgroup>', '</colgroup></table>'] },
};

const LEADING_TAG_RE = /^\s*<(\w+)/;

export function parseHTML(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const trimmed = text.trim();
  if (!trimmed) return fragment;

  // Detect if the response starts with a table-context element
  const match = LEADING_TAG_RE.exec(trimmed);
  const tag = match ? match[1].toLowerCase() : null;
  const wrapper = tag ? TABLE_WRAPPERS[tag] : null;

  if (wrapper) {
    // Use innerHTML with a proper wrapper element so the browser
    // doesn't auto-wrap the content in extra <table>/<tbody> nodes
    const temp = document.createElement('div');
    temp.innerHTML = wrapper.wrap[0] + trimmed + wrapper.wrap[1];

    // Walk down to the correct depth to find our actual elements
    let source: Element = temp;
    for (let i = 0; i < wrapper.depth; i++) {
      source = source.firstElementChild!;
    }

    const children = Array.from(source.childNodes);
    for (const child of children) {
      fragment.appendChild(child);
    }
  } else {
    // Standard path: use DOMParser for non-table HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'text/html');
    const children = Array.from(doc.body.childNodes);
    for (const child of children) {
      fragment.appendChild(document.importNode(child, true));
    }
  }

  return fragment;
}

export function parseHTMLDocument(text: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/html');
}
