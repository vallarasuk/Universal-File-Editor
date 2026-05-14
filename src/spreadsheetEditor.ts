import * as vscode from 'vscode';
import * as path from 'path';
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
            const ext = path.extname(document.uri.fsPath).toLowerCase();
            let data: any[][] = [];
            let originalFormat: 'array' | 'object' | 'primitive' = 'array';
            let detectedType = ext.substring(1).toUpperCase();

            try {
                if (ext === '.csv' || ext === '.tsv') {
                    const content = document.getText();
                    const results = Papa.parse(content, { delimiter: ext === '.tsv' ? '\t' : ',', skipEmptyLines: 'greedy' });
                    data = results.data as any[][];
                    detectedType = ext === '.tsv' ? 'TSV' : 'CSV';
                } else if (ext === '.xlsx') {
                    const buffer = await vscode.workspace.fs.readFile(document.uri);
                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(buffer as any);
                    const worksheet = workbook.getWorksheet(1);
                    if (worksheet) {
                        worksheet.eachRow({ includeEmpty: true }, (row, _rowNumber) => {
                            const rowArray = Array.isArray(row.values) ? row.values.slice(1) : [];
                            data.push(rowArray.map(v => (v && typeof v === 'object' && 'result' in v) ? v.result : v));
                        });
                    }
                    detectedType = 'Excel (XLSX)';
                } else if (ext === '.json' || ext === '.jsonl') {
                    const content = document.getText().trim();
                    if (!content) {
                        data = [['Empty File']];
                    } else {
                        let parsed;
                        if (ext === '.jsonl') {
                            parsed = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
                            detectedType = 'JSONL';
                        } else {
                            parsed = JSON.parse(content);
                            detectedType = 'JSON';
                            if (!Array.isArray(parsed)) {
                                originalFormat = 'object';
                                parsed = [parsed];
                            }
                        }

                        if (parsed.length > 0) {
                            if (originalFormat === 'object') {
                                const obj = parsed[0];
                                if (typeof obj !== 'object' || obj === null) {
                                    originalFormat = 'primitive';
                                    data = [['Value'], [obj]];
                                } else {
                                    data = [['Key', 'Value']];
                                    Object.keys(obj).forEach(k => {
                                        let val = obj[k];
                                        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                                        data.push([k, val]);
                                    });
                                }
                            } else {
                                const allKeys = new Set<string>();
                                parsed.forEach((obj: any) => {
                                    if (typeof obj === 'object' && obj !== null) {
                                        Object.keys(obj).forEach(k => allKeys.add(k));
                                    }
                                });
                                const headers = Array.from(allKeys);
                                if (headers.length === 0) {
                                    data = [['Value'], ...parsed.map((v: any) => [typeof v === 'object' ? JSON.stringify(v) : v])];
                                } else {
                                    data = [headers];
                                    parsed.forEach((obj: any) => {
                                        data.push(headers.map(h => {
                                            const val = obj ? obj[h] : undefined;
                                            return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
                                        }));
                                    });
                                }
                            }
                        }
                    }
                } else if (ext === '.xml') {
                    const content = document.getText();
                    const parser = new XMLParser();
                    const jsonObj = parser.parse(content);
                    detectedType = 'XML';
                    
                    // Recursive function to find the first array
                    const findArray = (obj: any): any[] | null => {
                        if (Array.isArray(obj)) return obj;
                        if (typeof obj !== 'object' || obj === null) return null;
                        for (const key of Object.keys(obj)) {
                            const res = findArray(obj[key]);
                            if (res) return res;
                        }
                        return null;
                    };

                    const items = findArray(jsonObj);
                    if (items && items.length > 0) {
                        const allKeys = new Set<string>();
                        items.forEach(item => {
                            if (typeof item === 'object' && item !== null) {
                                Object.keys(item).forEach(k => allKeys.add(k));
                            }
                        });
                        const headers = Array.from(allKeys);
                        if (headers.length > 0) {
                            data = [headers];
                            items.forEach((item: any) => data.push(headers.map(h => item[h])));
                        } else {
                            data = [['Value'], ...items.map(i => [i])];
                        }
                    } else if (jsonObj) {
                        originalFormat = 'object';
                        data = [['Key', 'Value']];
                        const root = Object.values(jsonObj)[0] as any;
                        if (root && typeof root === 'object') {
                            Object.keys(root).forEach(k => data.push([k, typeof root[k] === 'object' ? JSON.stringify(root[k]) : root[k]]));
                        }
                    }
                } else if (ext === '.yaml' || ext === '.yml') {
                    const content = document.getText();
                    const parsed: any = yaml.load(content);
                    detectedType = 'YAML';
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const allKeys = new Set<string>();
                        parsed.forEach(obj => {
                            if (typeof obj === 'object' && obj !== null) Object.keys(obj).forEach(k => allKeys.add(k));
                        });
                        const headers = Array.from(allKeys);
                        data = [headers];
                        parsed.forEach(obj => data.push(headers.map(h => obj[h])));
                    } else if (parsed && typeof parsed === 'object') {
                        originalFormat = 'object';
                        data = [['Key', 'Value']];
                        Object.keys(parsed).forEach(k => {
                            let val = parsed[k];
                            if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                            data.push([k, val]);
                        });
                    } else if (parsed !== undefined) {
                        originalFormat = 'primitive';
                        data = [['Value'], [parsed]];
                    }
                }
            } catch (e: any) {
                webviewPanel.webview.postMessage({ type: 'error', message: `Parse Error: ${e.message}` });
                return;
            }

            webviewPanel.webview.postMessage({
                type: 'update',
                data: data,
                raw: document.getText(),
                filename: path.basename(document.uri.fsPath),
                originalFormat: originalFormat,
                info: { type: detectedType, rows: data.length > 0 ? data.length - 1 : 0 }
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
                case 'ready':
                    updateWebview();
                    break;
                case 'saveRaw':
                    try {
                        const content = e.content;
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
                        await vscode.workspace.applyEdit(edit);
                        vscode.window.showInformationMessage('File saved successfully.');
                    } catch (err: any) {
                        vscode.window.showErrorMessage(`Failed to save raw content: ${err.message}`);
                    }
                    break;
                case 'save':
                    try {
                        const updatedData: any[][] = e.data;
                        const originalFormat = e.originalFormat || 'array';
                        const ext = path.extname(document.uri.fsPath).toLowerCase();
                        let newContent: string | Uint8Array = '';

                        if (ext === '.csv' || ext === '.tsv') {
                            newContent = Papa.unparse(updatedData, { delimiter: ext === '.tsv' ? '\t' : ',' });
                        } else if (ext === '.xlsx') {
                            const workbook = new ExcelJS.Workbook();
                            const worksheet = workbook.addWorksheet('Sheet1');
                            updatedData.forEach(row => {
                                worksheet.addRow(row.map(cell => {
                                    if (cell === 'true') return true;
                                    if (cell === 'false') return false;
                                    if (!isNaN(Number(cell)) && cell !== '') return Number(cell);
                                    return cell;
                                }));
                            });
                            const buffer = await workbook.xlsx.writeBuffer();
                            await vscode.workspace.fs.writeFile(document.uri, new Uint8Array(buffer));
                            return;
                        } else if (ext === '.json' || ext === '.jsonl') {
                            let output: any;
                            if (originalFormat === 'primitive') {
                                output = updatedData[1] ? updatedData[1][0] : null;
                                if (!isNaN(Number(output)) && output !== '') output = Number(output);
                                else if (output === 'true') output = true;
                                else if (output === 'false') output = false;
                            } else if (originalFormat === 'object') {
                                const obj: any = {};
                                updatedData.slice(1).forEach(row => {
                                    const key = row[0];
                                    let val = row[1];
                                    if (val === 'true') val = true;
                                    else if (val === 'false') val = false;
                                    else if (!isNaN(Number(val)) && val !== '') val = Number(val);
                                    else { try { val = JSON.parse(val); } catch {} }
                                    if (key) obj[key] = val;
                                });
                                output = obj;
                            } else {
                                const headers = updatedData[0];
                                output = updatedData.slice(1).map(row => {
                                    const obj: any = {};
                                    headers.forEach((h, i) => {
                                        let val = row[i];
                                        if (val === 'true') val = true;
                                        else if (val === 'false') val = false;
                                        else if (!isNaN(Number(val)) && val !== '') val = Number(val);
                                        else { try { val = JSON.parse(val); } catch {} }
                                        obj[h] = val;
                                    });
                                    return obj;
                                });
                            }
                            if (ext === '.jsonl') {
                                newContent = Array.isArray(output) ? output.map(obj => JSON.stringify(obj)).join('\n') : JSON.stringify(output);
                            } else {
                                newContent = JSON.stringify(output, null, 2);
                            }
                        } else if (ext === '.xml') {
                            // Saving XML is complex due to structure loss. We'll use a basic approach.
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
                            let output: any;
                            if (originalFormat === 'primitive') {
                                output = updatedData[1] ? updatedData[1][0] : null;
                            } else if (originalFormat === 'object') {
                                const obj: any = {};
                                updatedData.slice(1).forEach(row => { if (row[0]) obj[row[0]] = row[1]; });
                                output = obj;
                            } else {
                                const headers = updatedData[0];
                                output = updatedData.slice(1).map(row => {
                                    const obj: any = {};
                                    headers.forEach((h, i) => obj[h] = row[i]);
                                    return obj;
                                });
                            }
                            newContent = yaml.dump(output);
                        }

                        if (typeof newContent === 'string') {
                            const edit = new vscode.WorkspaceEdit();
                            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newContent);
                            await vscode.workspace.applyEdit(edit);
                        }
                    } catch (err: any) {
                        vscode.window.showErrorMessage(`Failed to save: ${err.message}`);
                    }
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
                    <div class="toolbar-group">
                        <button id="saveBtn" class="primary" title="Save Changes (Ctrl+S)">Save</button>
                        <div class="view-toggle">
                            <button id="gridModeBtn" class="active" title="Switch to Grid View">Grid</button>
                            <button id="rawModeBtn" title="Switch to Raw View">Raw</button>
                        </div>
                    </div>
                    
                    <input type="text" id="searchBox" placeholder="Search data...">
                    
                    <div class="spacer"></div>
                    
                    <div class="toolbar-group">
                        <button id="formatBtn" title="Beautify/Format Source">Format</button>
                        <button id="copyBtn" title="Copy Content to Clipboard">Copy</button>
                        <div id="status-info">
                            <span id="format-tag"></span>
                            <span id="row-count"></span>
                        </div>
                    </div>
                </div>

                <div id="grid-container" class="view-panel">
                    <table id="spreadsheet-grid"></table>
                </div>

                <div id="raw-container" class="view-panel hidden">
                    <textarea id="raw-editor" spellcheck="false"></textarea>
                </div>

                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}
