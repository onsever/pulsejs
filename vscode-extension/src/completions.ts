import * as vscode from 'vscode';
import { getAttributeContext, isTypingAttributeName } from './utils';
import { ATTR_DOCS, METHOD_DOCS, BEHAVIOR_DOCS, MODIFIER_DOCS, TRIGGER_EVENT_DOCS, TRIGGER_MODIFIER_DOCS } from './docs';

const REQUEST_SNIPPETS: Array<{ label: string; snippet: string; doc: string }> = [
  { label: 'POST form to target', snippet: 'POST ${1:/path} {this} > ${2:#target}', doc: 'POST the current element as form data to a target.' },
  { label: 'DELETE with confirm', snippet: "DELETE ${1:/path} > closest ${2:tr}.outer :confirm('${3:Are you sure?}')", doc: 'DELETE request with closest ancestor swap and confirmation dialog.' },
  { label: 'GET into target', snippet: 'GET ${1:/path} > ${2:#target}', doc: 'GET content and swap into a target element.' },
  { label: 'PUT with body', snippet: "PUT ${1:/path} {${2:this}} > ${3:#target}", doc: 'PUT request with body content.' },
  { label: 'PATCH partial', snippet: "PATCH ${1:/path} {only ${2:name, email}} > ${3:this}", doc: 'PATCH with filtered form fields.' },
];

const TRIGGER_SNIPPETS: Array<{ label: string; snippet: string; doc: string }> = [
  { label: 'input changed debounce', snippet: 'input changed debounce ${1:300}ms', doc: 'Fire on input change with debounce.' },
  { label: 'every polling', snippet: 'every ${1:2}s', doc: 'Poll at regular intervals.' },
  { label: 'revealed once', snippet: 'revealed once', doc: 'Fire once when element enters viewport.' },
  { label: 'keyup with filter', snippet: 'keyup[${1:key===\'Enter\'}]', doc: 'Fire on keyup with key filter.' },
];

export class PulseCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionList | null {
    // Check if typing attribute name
    const attrPrefix = isTypingAttributeName(document, position);
    if (attrPrefix) {
      const replaceStart = position.translate(0, -attrPrefix.length);
      const replaceRange = new vscode.Range(replaceStart, position);
      const items = this.getAttributeNameCompletions(attrPrefix, replaceRange);
      if (items.length) return new vscode.CompletionList(items, true);
    }

    const ctx = getAttributeContext(document, position);
    if (!ctx) return null;

    let items: vscode.CompletionItem[] | null = null;
    switch (ctx.attrName) {
      case 'p-request': items = this.getRequestCompletions(ctx.segment, ctx.prefix, ctx.fullValue); break;
      case 'p-trigger': items = this.getTriggerCompletions(ctx.segment, ctx.prefix, ctx.fullValue); break;
      case 'p-on': items = this.getOnCompletions(ctx.segment, ctx.prefix); break;
      case 'p-history': items = this.getSimpleCompletions(['push', 'replace', 'false'], ctx.prefix); break;
      case 'p-boost': items = this.getSimpleCompletions(['true', 'false'], ctx.prefix); break;
      case 'p-oob': items = this.getSimpleCompletions(['true', 'replace', 'outer', 'append', 'prepend', 'before', 'after'], ctx.prefix); break;
      case 'p-inherit': items = this.getInheritCompletions(ctx.prefix); break;
      default: return null;
    }
    if (items && items.length) return new vscode.CompletionList(items, false);
    return null;
  }

  private getAttributeNameCompletions(prefix: string, range: vscode.Range): vscode.CompletionItem[] {
    const attrs = ['p-request', 'p-trigger', 'p-on', 'p-history', 'p-boost', 'p-oob', 'p-ignore', 'p-inherit'];
    return attrs
      .filter(a => a.startsWith(prefix))
      .map(a => {
        const item = new vscode.CompletionItem(a, vscode.CompletionItemKind.Property);
        item.insertText = new vscode.SnippetString(a === 'p-ignore' ? a : `${a}="$1"`);
        item.documentation = new vscode.MarkdownString(ATTR_DOCS[a] || '');
        item.filterText = a;
        item.range = range;
        return item;
      });
  }

  private getRequestCompletions(segment: string, prefix: string, fullValue: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    // Add snippets when at the start of an empty value
    if (segment === 'start' && !fullValue.trim()) {
      for (const s of REQUEST_SNIPPETS) {
        const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(s.snippet);
        item.documentation = new vscode.MarkdownString(s.doc);
        item.sortText = '0' + s.label; // Sort snippets first
        items.push(item);
      }
    }

    switch (segment) {
      case 'start':
        items.push(...this.makeItems(METHOD_DOCS, vscode.CompletionItemKind.Keyword, prefix, ' '));
        return items;
      case 'behavior':
        return this.makeItems(BEHAVIOR_DOCS, vscode.CompletionItemKind.EnumMember, prefix);
      case 'modifier':
        return this.makeItems(MODIFIER_DOCS, vscode.CompletionItemKind.Function, prefix);
      case 'target':
        return this.makeItems({
          this: 'Target the triggering element itself.',
          closest: '`closest <selector>` — Find the nearest matching ancestor.',
          find: '`find <selector>` — Find a descendant of the triggering element.',
        }, vscode.CompletionItemKind.Keyword, prefix);
      case 'body':
        return this.makeItems({
          this: 'Serialize the triggering element as the body.',
          only: '`only field1, field2` — Include only these fields.',
          not: '`not field1, field2` — Exclude these fields.',
        }, vscode.CompletionItemKind.Keyword, prefix);
      default:
        return items;
    }
  }

  private getTriggerCompletions(segment: string, prefix: string, fullValue: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    // Add snippets when at event segment with empty value
    if (segment === 'event' && !fullValue.trim()) {
      for (const s of TRIGGER_SNIPPETS) {
        const item = new vscode.CompletionItem(s.label, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(s.snippet);
        item.documentation = new vscode.MarkdownString(s.doc);
        item.sortText = '0' + s.label;
        items.push(item);
      }
    }

    switch (segment) {
      case 'event':
        items.push(...this.makeItems(TRIGGER_EVENT_DOCS, vscode.CompletionItemKind.Event, prefix));
        return items;
      case 'modifier':
        return this.makeItems(TRIGGER_MODIFIER_DOCS, vscode.CompletionItemKind.Keyword, prefix);
      default:
        return items;
    }
  }

  private getOnCompletions(segment: string, prefix: string): vscode.CompletionItem[] {
    // Don't offer completions inside handler expressions
    if (segment === 'handler') return [];

    const events: Record<string, string> = {
      'pulse:before': 'Fires before the request is made. Cancel with event.preventDefault().',
      'pulse:beforeSend': 'Fires just before fetch(). Can modify the request.',
      'pulse:beforeSwap': 'Fires before DOM swap. Can modify content.',
      'pulse:afterSwap': 'Fires after DOM swap completes.',
      'pulse:afterSettle': 'Fires after settle (CSS class lifecycle) completes.',
      'pulse:error': 'Fires on request error.',
      'pulse:confirm': 'Fires when :confirm modifier triggers. Prevent default for custom confirm UI, call detail.issueRequest() to proceed.',
    };
    return this.makeItems(events, vscode.CompletionItemKind.Event, prefix);
  }

  private getInheritCompletions(prefix: string): vscode.CompletionItem[] {
    const values = ['false', 'p-request', 'p-trigger', 'p-on', 'p-history', 'p-boost'];
    return values
      .filter(v => v.startsWith(prefix))
      .map(v => {
        const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Value);
        if (v === 'false') {
          item.documentation = new vscode.MarkdownString('Disable all attribute inheritance for this element.');
        } else {
          item.documentation = new vscode.MarkdownString(`Allow inheritance of the \`${v}\` attribute.`);
        }
        return item;
      });
  }

  private getSimpleCompletions(values: string[], prefix: string): vscode.CompletionItem[] {
    return values
      .filter(v => v.startsWith(prefix))
      .map(v => new vscode.CompletionItem(v, vscode.CompletionItemKind.Value));
  }

  private makeItems(docs: Record<string, string>, kind: vscode.CompletionItemKind, prefix: string, suffix = ''): vscode.CompletionItem[] {
    return Object.entries(docs)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, doc]) => {
        const item = new vscode.CompletionItem(key, kind);
        item.documentation = new vscode.MarkdownString(doc);
        if (suffix) item.insertText = key + suffix;
        return item;
      });
  }
}
