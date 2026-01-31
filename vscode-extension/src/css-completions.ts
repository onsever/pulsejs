import * as vscode from 'vscode';

const PULSE_CSS_CLASSES: Record<string, string> = {
  'pulse-request': 'Applied to the element and indicator during an active request.',
  'pulse-swapping': 'Applied to the target element during DOM swap.',
  'pulse-settling': 'Applied to the target after swap, removed after settle completes.',
  'pulse-added': 'Applied to newly inserted elements after swap, removed after settle.',
};

export class PulseCssClassCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionItem[] | null {
    if (!this.isInsideClassAttribute(document, position)) return null;

    const line = document.lineAt(position.line).text;
    const before = line.slice(0, position.character);
    // Get the prefix being typed (word chars and hyphens)
    const prefixMatch = before.match(/([\w-]*)$/);
    const prefix = prefixMatch ? prefixMatch[1] : '';

    return Object.entries(PULSE_CSS_CLASSES)
      .filter(([cls]) => cls.startsWith(prefix))
      .map(([cls, doc]) => {
        const item = new vscode.CompletionItem(cls, vscode.CompletionItemKind.Value);
        item.documentation = new vscode.MarkdownString(doc);
        item.detail = 'pulse.html CSS class';
        return item;
      });
  }

  private isInsideClassAttribute(document: vscode.TextDocument, position: vscode.Position): boolean {
    const line = document.lineAt(position.line).text;
    const before = line.slice(0, position.character);
    // Check if we're inside class="..."
    const classAttrMatch = before.match(/class\s*=\s*"[^"]*$/);
    return !!classAttrMatch;
  }
}
