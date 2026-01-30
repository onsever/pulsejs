import * as vscode from 'vscode';
import { PulseCompletionProvider } from './completions';
import { PulseCssClassCompletionProvider } from './css-completions';
import { PulseHoverProvider } from './hover';
import { setupDiagnostics } from './diagnostics';

const SUPPORTED_LANGUAGES = [
  { language: 'html', scheme: 'file' },
  { language: 'html', scheme: 'untitled' },
  { language: 'php', scheme: 'file' },
  { language: 'blade', scheme: 'file' },
  { language: 'ejs', scheme: 'file' },
  { language: 'erb', scheme: 'file' },
  { language: 'handlebars', scheme: 'file' },
  { language: 'twig', scheme: 'file' },
  { language: 'gohtml', scheme: 'file' },
  { language: 'go-template', scheme: 'file' },
];

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('pulse');

  if (config.get<boolean>('completions.enabled', true)) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        SUPPORTED_LANGUAGES,
        new PulseCompletionProvider(),
        '"', '.', ':', '>', '{', ' ', '-',
      ),
    );

    // CSS class completions in class="" attributes
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        SUPPORTED_LANGUAGES,
        new PulseCssClassCompletionProvider(),
        '"', ' ',
      ),
    );
  }

  if (config.get<boolean>('hover.enabled', true)) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, new PulseHoverProvider()),
    );
  }

  if (config.get<boolean>('diagnostics.enabled', true)) {
    setupDiagnostics(context);
  }

  // Insert Template command
  context.subscriptions.push(
    vscode.commands.registerCommand('pulse.insertTemplate', () => insertTemplate()),
  );
}

async function insertTemplate() {
  const templates: Array<{ label: string; detail: string; snippet: string }> = [
    {
      label: 'GET Request',
      detail: 'Element with a Pulse GET request',
      snippet: '<div p-request="GET /api/${1:endpoint} > ${2:#target}" p-trigger="${3:click}">\n\t$0\n</div>',
    },
    {
      label: 'POST Form',
      detail: 'Form with Pulse POST request',
      snippet: '<form p-request="POST /api/${1:endpoint} {this} > ${2:#result}">\n\t<input type="text" name="${3:field}" />\n\t<button type="submit">Submit</button>\n</form>',
    },
    {
      label: 'DELETE with Confirm',
      detail: 'Delete button with confirmation',
      snippet: '<button p-request="DELETE /api/${1:resource}/${2:id} > closest ${3:tr}.outer :confirm(\'Are you sure?\')">Delete</button>',
    },
    {
      label: 'Search Input',
      detail: 'Debounced search input',
      snippet: '<input type="search" name="${1:q}"\n\tp-request="GET /api/${2:search} {this} > ${3:#results}"\n\tp-trigger="input changed debounce ${4:300}ms"\n\tplaceholder="${5:Search...}" />',
    },
    {
      label: 'Infinite Scroll',
      detail: 'Load more on scroll',
      snippet: '<div id="${1:list}"><!-- items --></div>\n<div p-request="GET /api/${2:items}?page=${3:2} > #${1:list}.append"\n\tp-trigger="revealed">Loading...</div>',
    },
    {
      label: 'Polling',
      detail: 'Poll a URL at intervals',
      snippet: '<div p-request="GET /api/${1:status} > this"\n\tp-trigger="every ${2:2}s">\n\t$0\n</div>',
    },
    {
      label: 'Tabs',
      detail: 'Tab navigation pattern',
      snippet: '<div role="tablist">\n\t<button p-request="GET /api/${1:tab}/1 > #${2:content}">${3:Tab 1}</button>\n\t<button p-request="GET /api/${1:tab}/2 > #${2:content}">${4:Tab 2}</button>\n</div>\n<div id="${2:content}">$0</div>',
    },
    {
      label: 'Boosted Nav',
      detail: 'SPA-like navigation',
      snippet: '<nav p-boost="true">\n\t<a href="/${1:page1}">${2:Page 1}</a>\n\t<a href="/${3:page2}">${4:Page 2}</a>\n</nav>',
    },
    {
      label: 'Modal Trigger',
      detail: 'Button that loads modal content',
      snippet: '<button p-request="GET /api/${1:modal} > ${2:#modal-container}">${3:Open Modal}</button>\n<div id="${4:modal-container}"></div>',
    },
    {
      label: 'Inline Edit',
      detail: 'Click-to-edit element',
      snippet: '<div p-request="GET /api/${1:edit}/${2:id} > this.outer"\n\tp-trigger="click">${3:Click to edit}</div>',
    },
  ];

  const picked = await vscode.window.showQuickPick(
    templates.map(t => ({ label: t.label, detail: t.detail, _snippet: t.snippet })),
    { placeHolder: 'Select a Pulse.js template to insert' },
  );

  if (!picked) return;

  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  editor.insertSnippet(new vscode.SnippetString((picked as any)._snippet));
}

export function deactivate() {}
