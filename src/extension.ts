import * as vscode from 'vscode';
import { SpreadsheetEditorProvider } from './spreadsheetEditor';
import { MarkdownEditorProvider } from './markdownEditor';
import { MediaViewerProvider } from './mediaViewer';
import { TextViewerProvider } from './textViewer';

export function activate(context: vscode.ExtensionContext) {
    // Register Providers
    context.subscriptions.push(SpreadsheetEditorProvider.register(context));
    context.subscriptions.push(MarkdownEditorProvider.register(context));
    context.subscriptions.push(MediaViewerProvider.register(context));
    context.subscriptions.push(TextViewerProvider.register(context));

    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('xlsxViewer.openAsSpreadsheet', (uri: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (targetUri) {
            vscode.commands.executeCommand('vscode.openWith', targetUri, 'xlsxViewer.spreadsheetEditor');
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('xlsxViewer.openAsMarkdown', (uri: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (targetUri) {
            vscode.commands.executeCommand('vscode.openWith', targetUri, 'xlsxViewer.markdownEditor');
        }
    }));
}

export function deactivate() {}
