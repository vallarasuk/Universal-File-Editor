    import * as vscode from 'vscode';
import * as path from 'path';

export class TextViewerProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new TextViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(TextViewerProvider.viewType, provider);
    }

    private static readonly viewType = 'xlsxViewer.textViewer';

    constructor(
        _context: vscode.ExtensionContext
    ) { }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        const updateWebview = () => {
            const content = document.getText();
            webviewPanel.webview.postMessage({
                type: 'update',
                text: content,
                filename: path.basename(document.uri.fsPath)
            });
        };

        webviewPanel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    :root {
                        --bg-gradient: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
                        --glass: rgba(255, 255, 255, 0.05);
                        --border: rgba(255, 255, 255, 0.1);
                        --accent: #007acc;
                    }
                    body { 
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                        background: var(--bg-gradient); 
                        color: #e0e0e0; 
                        margin: 0;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .toolbar {
                        padding: 12px 20px;
                        background: var(--glass);
                        backdrop-filter: blur(20px);
                        border-bottom: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .glass-container {
                        margin: 20px;
                        flex: 1;
                        background: var(--glass);
                        backdrop-filter: blur(20px);
                        border: 1px solid var(--border);
                        border-radius: 12px;
                        padding: 20px;
                        overflow: auto;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    }
                    #content { 
                        font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
                        white-space: pre-wrap; 
                        word-wrap: break-word; 
                        border: none; 
                        background: transparent; 
                        color: inherit; 
                        width: 100%; 
                        outline: none; 
                        line-height: 1.6;
                        font-size: 14px;
                    }
                    h3 { margin: 0; font-weight: 500; font-size: 16px; opacity: 0.8; }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <h3 id="title"></h3>
                    <div style="font-size: 12px; opacity: 0.5;">Premium Text Viewer</div>
                </div>
                <div class="glass-container">
                    <pre id="content" contenteditable="true"></pre>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const content = document.getElementById('content');
                    
                    let debounceTimer;
                    content.addEventListener('input', () => {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
                            vscode.postMessage({
                                type: 'save',
                                text: content.innerText
                            });
                        }, 300);
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'update') {
                            document.getElementById('title').textContent = message.filename;
                            content.innerText = message.text;
                        }
                    });
                </script>
            </body>
            </html>
        `;

        webviewPanel.webview.onDidReceiveMessage(async e => {
            if (e.type === 'save') {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), e.text);
                await vscode.workspace.applyEdit(edit);
            }
        });

        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        updateWebview();
    }
}
