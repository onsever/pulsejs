import * as vscode from 'vscode';
import { getAttributeContext } from './utils';
import { ATTR_DOCS, METHOD_DOCS, BEHAVIOR_DOCS, MODIFIER_DOCS, TRIGGER_EVENT_DOCS, TRIGGER_MODIFIER_DOCS } from './docs';

export class PulseHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Hover | null {
    // Check if hovering over an attribute name
    const line = document.lineAt(position.line).text;
    const wordRange = document.getWordRangeAtPosition(position, /p-[a-z]+/);
    if (wordRange) {
      const word = document.getText(wordRange);
      if (ATTR_DOCS[word]) {
        return new vscode.Hover(new vscode.MarkdownString(ATTR_DOCS[word]));
      }
    }

    // Check if inside an attribute value
    const ctx = getAttributeContext(document, position);
    if (!ctx) return null;

    const word = getWordAtOffset(ctx.fullValue, ctx.cursorOffset);
    if (!word) return null;

    const doc = lookupDoc(ctx.attrName, ctx.segment, word);
    if (doc) {
      return new vscode.Hover(new vscode.MarkdownString(doc));
    }

    return null;
  }
}

function getWordAtOffset(text: string, offset: number): string {
  let start = offset;
  let end = offset;
  while (start > 0 && /[a-zA-Z0-9._:-]/.test(text[start - 1])) start--;
  while (end < text.length && /[a-zA-Z0-9._:-]/.test(text[end])) end++;
  return text.slice(start, end);
}

function lookupDoc(attrName: string, segment: string, word: string): string | null {
  // Try all doc maps
  if (METHOD_DOCS[word]) return `**${word}** — ${METHOD_DOCS[word]}`;
  if (BEHAVIOR_DOCS[word]) return `**${word}** — ${BEHAVIOR_DOCS[word]}`;
  if (MODIFIER_DOCS[word]) return MODIFIER_DOCS[word];
  if (TRIGGER_EVENT_DOCS[word]) return `**${word}** — ${TRIGGER_EVENT_DOCS[word]}`;
  if (TRIGGER_MODIFIER_DOCS[word]) return `**${word}** — ${TRIGGER_MODIFIER_DOCS[word]}`;
  return null;
}
