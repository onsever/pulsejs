export function applySelect(fragment: DocumentFragment, selector: string): DocumentFragment {
  // Create a temporary container to query against
  const temp = document.createElement('div');
  temp.appendChild(fragment);

  const selected = temp.querySelector(selector);
  if (!selected) {
    // Return original fragment if selector didn't match
    const result = document.createDocumentFragment();
    while (temp.firstChild) result.appendChild(temp.firstChild);
    return result;
  }

  const result = document.createDocumentFragment();
  result.appendChild(selected);
  return result;
}
