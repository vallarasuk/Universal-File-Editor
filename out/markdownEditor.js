"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownEditorProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const markdown_it_1 = __importDefault(require("markdown-it"));
class MarkdownEditorProvider {
    static register(context) {
        const provider = new MarkdownEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(MarkdownEditorProvider.viewType, provider);
    }
    constructor(context) {
        this.context = context;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        const md = new markdown_it_1.default({
            html: true,
            linkify: true,
            typographer: true
        });
        function updateWebview() {
            const content = document.getText();
            let rendered = md.render(content);
            // Basic KaTex math rendering (simple regex for demonstration)
            rendered = rendered.replace(/\$\$(.*?)\$\$/g, (_match, formula) => {
                try {
                    return require('katex').renderToString(formula, { displayMode: true });
                }
                catch (e) {
                    return formula;
                }
            });
            rendered = rendered.replace(/\$(.*?)\$/g, (_match, formula) => {
                try {
                    return require('katex').renderToString(formula, { displayMode: false });
                }
                catch (e) {
                    return formula;
                }
            });
            webviewPanel.webview.postMessage({
                type: 'update',
                content: rendered
            });
        }
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });
        webviewPanel.webview.onDidReceiveMessage(async (e) => {
            switch (e.type) {
                case 'save':
                    const TurndownService = require('turndown');
                    const turndownService = new TurndownService();
                    const markdown = turndownService.turndown(e.content);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), markdown);
                    await vscode.workspace.applyEdit(edit);
                    break;
            }
        });
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
        updateWebview();
    }
    getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'markdown', 'markdown.js')));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'markdown', 'markdown.css')));
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Markdown Editor</title>
            </head>
            <body>
                <div id="toolbar" class="glass">
                    <button id="boldBtn"><b>B</b></button>
                    <button id="italicBtn"><i>I</i></button>
                    <button id="saveBtn">Save</button>
                </div>
                <div id="editor-container">
                    <div id="preview" class="markdown-body"></div>
                </div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}
exports.MarkdownEditorProvider = MarkdownEditorProvider;
MarkdownEditorProvider.viewType = 'xlsxViewer.markdownEditor';
//# sourceMappingURL=markdownEditor.js.map