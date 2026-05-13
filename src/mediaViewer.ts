import * as vscode from 'vscode';

export class MediaViewerProvider implements vscode.CustomReadonlyEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new MediaViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(MediaViewerProvider.viewType, provider);
    }

    private static readonly viewType = 'xlsxViewer.mediaViewer';

    constructor(
        _context: vscode.ExtensionContext
    ) { }

    public async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => { } };
    }

    public async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        const mediaUri = webviewPanel.webview.asWebviewUri(document.uri);

        webviewPanel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1e1e1e; }
                    img { max-width: 90%; max-height: 90%; box-shadow: 0 0 20px rgba(0,0,0,0.5); border-radius: 8px; }
                </style>
            </head>
            <body>
                <img src="${mediaUri}" alt="Media Content">
            </body>
            </html>
        `;
    }
}
