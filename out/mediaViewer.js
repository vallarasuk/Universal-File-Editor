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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaViewerProvider = void 0;
const vscode = __importStar(require("vscode"));
class MediaViewerProvider {
    static register(context) {
        const provider = new MediaViewerProvider(context);
        return vscode.window.registerCustomEditorProvider(MediaViewerProvider.viewType, provider);
    }
    constructor(_context) { }
    async openCustomDocument(uri, _openContext, _token) {
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewPanel, _token) {
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
exports.MediaViewerProvider = MediaViewerProvider;
MediaViewerProvider.viewType = 'xlsxViewer.mediaViewer';
//# sourceMappingURL=mediaViewer.js.map