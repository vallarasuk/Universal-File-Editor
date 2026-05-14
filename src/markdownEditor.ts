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
                case 'ready':
                    updateWebview();
                    break;
                case 'save':
                    try {
                        const TurndownService = require('turndown');
                        const turndownService = new TurndownService({
                            headingStyle: 'atx',
                            hr: '---',
                            bulletListMarker: '-',
                            codeBlockStyle: 'fenced'
                        });
                        
                        // Add plugins for better GFM support
                        const turndownPluginGfm = require('joplin-turndown-plugin-gfm');
                        turndownService.use(turndownPluginGfm.gfm);

                        const markdown = turndownService.turndown(e.content);
                        
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), markdown);
                        await vscode.workspace.applyEdit(edit);
                    } catch (err: any) {
                        vscode.window.showErrorMessage(`Failed to save markdown: ${err.message}`);
                    }
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
                    <div class="group">
                        <button id="h1Btn">H1</button>
                        <button id="h2Btn">H2</button>
                        <button id="h3Btn">H3</button>
                    </div>
                    <div class="group">
                        <button id="boldBtn" title="Bold"><b>B</b></button>
                        <button id="italicBtn" title="Italic"><i>I</i></button>
                        <button id="strikeBtn" title="Strikethrough"><strike>S</strike></button>
                    </div>
                    <div class="group">
                        <button id="listBtn" title="Bullet List">• List</button>
                        <button id="numListBtn" title="Numbered List">1. List</button>
                        <button id="codeBtn" title="Code Block">Code</button>
                    </div>
                    <div class="spacer"></div>
                    <button id="saveBtn" class="primary">Save</button>
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

