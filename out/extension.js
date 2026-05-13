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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const spreadsheetEditor_1 = require("./spreadsheetEditor");
const markdownEditor_1 = require("./markdownEditor");
const mediaViewer_1 = require("./mediaViewer");
const textViewer_1 = require("./textViewer");
function activate(context) {
    // Register Providers
    context.subscriptions.push(spreadsheetEditor_1.SpreadsheetEditorProvider.register(context));
    context.subscriptions.push(markdownEditor_1.MarkdownEditorProvider.register(context));
    context.subscriptions.push(mediaViewer_1.MediaViewerProvider.register(context));
    context.subscriptions.push(textViewer_1.TextViewerProvider.register(context));
    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('xlsxViewer.openAsSpreadsheet', (uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (targetUri) {
            vscode.commands.executeCommand('vscode.openWith', targetUri, 'xlsxViewer.spreadsheetEditor');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('xlsxViewer.openAsMarkdown', (uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (targetUri) {
            vscode.commands.executeCommand('vscode.openWith', targetUri, 'xlsxViewer.markdownEditor');
        }
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map