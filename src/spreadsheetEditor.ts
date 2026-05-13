import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import * as Papa from 'papaparse';
import * as yaml from 'js-yaml';
import { XMLParser } from 'fast-xml-parser';

export class SpreadsheetEditorProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new SpreadsheetEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(SpreadsheetEditorProvider.viewType, provider);
    }

    private static readonly viewType = 'xlsxViewer.spreadsheetEditor';

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

        async function updateWebview() {
            const content = document.getText();
            const ext = path.extname(document.uri.fsPath).toLowerCase();
            let data: any[][] = [];

            if (ext === '.csv' || ext === '.tsv') {
                const results = Papa.parse(content, { delimiter: ext === '.tsv' ? '\t' : ',' });
                data = results.data as any[][];
            } else if (ext === '.xlsx') {
                // For XLSX we read as binary, but this is a TextEditorProvider
                // Wait, XLSX should probably use CustomEditorProvider (binary)
                // But the user's description says unified provider.
                // If it's a TextEditorProvider, document.getText() won't work for binary XLSX.
                // I'll handle binary reading separately if needed.
                const buffer: any = fs.readFileSync(document.uri.fsPath);
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.getWorksheet(1);
                worksheet?.eachRow((row, _rowNumber) => {
                    data.push(row.values as any[]);
                });
            } else if (ext === '.json' || ext === '.jsonl') {
                try {
                    let parsed;
                    if (ext === '.jsonl') {
                        parsed = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
                    } else {
                        parsed = JSON.parse(content);
                        if (!Array.isArray(parsed)) {
                            parsed = [parsed];
                        }
                    }

                    if (parsed.length > 0) {
                        const allKeys = new Set<string>();
                        parsed.forEach((obj: any) => {
                            if (typeof obj === 'object' && obj !== null) {
                                Object.keys(obj).forEach(k => allKeys.add(k));
                            }
                        });
                        const headers = Array.from(allKeys);
                        if (headers.length === 0 && typeof parsed[0] !== 'object') {
                            // Handle array of primitives
                            headers.push('Value');
                            data = [headers, ...parsed.map(v => [v])];
                        } else {
                            data = [headers];
                            parsed.forEach((obj: any) => {
                                data.push(headers.map(h => {
                                    const val = obj[h];
                                    return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
                                }));
                            });
                        }
                    }
                } catch (e: any) {
                    webviewPanel.webview.postMessage({ type: 'error', message: 'JSON Parse Error: ' + e.message });
                    return;
                }
            }
 else if (ext === '.xml') {
                try {
                    const parser = new XMLParser();
                    const jsonObj = parser.parse(content);
                    // Find first array-like structure
                    const key = Object.keys(jsonObj)[0];
                    const items = Array.isArray(jsonObj[key]) ? jsonObj[key] : [jsonObj[key]];
                    if (items.length > 0) {
                        const headers = Object.keys(items[0]);
                        data = [headers];
                        items.forEach((item: any) => data.push(headers.map(h => item[h])));
                    }
                } catch (e) {
                    console.error('Failed to parse XML:', e);
                }
            } else if (ext === '.yaml' || ext === '.yml') {
                try {
                    const parsed: any = yaml.load(content);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const headers = Object.keys(parsed[0]);
                        data = [headers];
                        parsed.forEach(obj => data.push(headers.map(h => obj[h])));
                    }
                } catch (e) {
                    console.error('Failed to parse YAML:', e);
                }
            }

            webviewPanel.webview.postMessage({
                type: 'update',
                data: data,
                filename: path.basename(document.uri.fsPath)
            });
        }

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        webviewPanel.webview.onDidReceiveMessage(async e => {
            switch (e.type) {
                case 'save':
                    const updatedData: any[][] = e.data;
                    const ext = path.extname(document.uri.fsPath).toLowerCase();
                    let newContent: string = '';

                    if (ext === '.csv' || ext === '.tsv') {
                        newContent = Papa.unparse(updatedData, { delimiter: ext === '.tsv' ? '\t' : ',' });
                    } else if (ext === '.xlsx') {
                        const workbook = new ExcelJS.Workbook();
                        const worksheet = workbook.addWorksheet('Sheet1');
                        updatedData.forEach(row => worksheet.addRow(row));
                        const buffer = await workbook.xlsx.writeBuffer();
                        fs.writeFileSync(document.uri.fsPath, buffer as any);
                        return; // Done for XLSX
                    } else if (ext === '.json' || ext === '.jsonl') {
                        if (ext === '.jsonl') {
                            const headers = updatedData[0];
                            newContent = updatedData.slice(1).map(row => {
                                const obj: any = {};
                                headers.forEach((h, i) => obj[h] = row[i]);
                                return JSON.stringify(obj);
                            }).join('\n');
                        } else {
                            const headers = updatedData[0];
                            const jsonArray = updatedData.slice(1).map(row => {
                                const obj: any = {};
                                headers.forEach((h, i) => obj[h] = row[i]);
                                return obj;
                            });
                            newContent = JSON.stringify(jsonArray, null, 2);
                        }
                    } else if (ext === '.xml') {
                        const headers = updatedData[0];
                        const items = updatedData.slice(1).map(row => {
                            const obj: any = {};
                            headers.forEach((h, i) => obj[h] = row[i]);
                            return obj;
                        });
                        const { XMLBuilder } = require('fast-xml-parser');
                        const builder = new XMLBuilder({ format: true });
                        newContent = builder.build({ root: { item: items } });
                    } else if (ext === '.yaml' || ext === '.yml') {
                        const headers = updatedData[0];
                        const items = updatedData.slice(1).map(row => {
                            const obj: any = {};
                            headers.forEach((h, i) => obj[h] = row[i]);
                            return obj;
                        });
                        newContent = yaml.dump(items);
                    }

                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newContent);
                    await vscode.workspace.applyEdit(edit);
                    break;
            }
        });

        updateWebview();
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'spreadsheet', 'spreadsheet.js')
        ));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'spreadsheet', 'spreadsheet.css')
        ));

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Spreadsheet Editor</title>
            </head>
            <body>
                <div id="toolbar" class="glass">
                    <button id="saveBtn">Save</button>
                    <button id="convertBtn">Convert</button>
                    <input type="text" id="searchBox" placeholder="Search...">
                </div>
                <div id="grid-container">
                    <table id="spreadsheet-grid"></table>
                </div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}
