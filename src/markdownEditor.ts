import * as vscode from 'vscode';
import * as path from 'path';
import MarkdownIt from 'markdown-it';

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new MarkdownEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(MarkdownEditorProvider.viewType, provider);
    }

    private static readonly viewType = 'xlsxViewer.markdownEditor';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        const md = new MarkdownIt({
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
                } catch (e) {
                    return formula;
                }
            });
            rendered = rendered.replace(/\$(.*?)\$/g, (_match, formula) => {
                try {
                    return require('katex').renderToString(formula, { displayMode: false });
                } catch (e) {
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

        webviewPanel.webview.onDidReceiveMessage(async e => {
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

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'markdown', 'markdown.js')
        ));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'markdown', 'markdown.css')
        ));

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
