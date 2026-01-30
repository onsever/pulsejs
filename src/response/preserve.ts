export function savePreserved(target: Element, preserveIds: string[]): Map<string, Element> {
  const saved = new Map<string, Element>();
  for (const id of preserveIds) {
    const el = target.querySelector(`#${id}`);
    if (el) saved.set(id, el);
  }
  return saved;
}

export function restorePreserved(root: Element | DocumentFragment, saved: Map<string, Element>): void {
  // Wrap fragment if needed for querySelector
  let container: Element;
  if (root instanceof DocumentFragment) {
    container = document.createElement('div');
    container.appendChild(root);
  } else {
    container = root;
  }

  for (const [id, savedEl] of saved) {
    const placeholder = container.querySelector(`#${id}`);
    if (placeholder) {
      placeholder.replaceWith(savedEl);
    }
  }

  // Move children back if we wrapped
  if (root instanceof DocumentFragment && container !== (root as unknown)) {
    while (container.firstChild) {
      root.appendChild(container.firstChild);
    }
  }
}
