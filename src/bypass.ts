import * as vscode from 'vscode';

/**
 * Checks if the given URI should bypass the custom editor and fall back to the default editor.
 */
export function shouldBypass(uri: vscode.Uri, providerType: string): boolean {
    const config = vscode.workspace.getConfiguration('xlsxViewer');

    // 1. Check if the text viewer provider is disabled completely
    if (providerType === 'textViewer' && config.get<boolean>('disableTextViewer', false)) {
        return true;
    }

    // 2. Check the URI scheme against excluded schemes
    const scheme = uri.scheme;
    const excludeSchemes = config.get<string[]>('excludeSchemes', [
        'git',
        'gitlens',
        'gitlens-git',
        'gitfs',
        'vscode-local-history',
        'pr',
        'review'
    ]);
    if (excludeSchemes.includes(scheme)) {
        return true;
    }

    // 3. Check the path/filename against excluded paths
    const fsPath = uri.fsPath || uri.path;
    const normalizedPath = fsPath.replace(/\\/g, '/');
    
    // Check default patterns directly for extra safety
    if (
        normalizedPath.includes('/.git/') || 
        normalizedPath.includes('/node_modules/') ||
        normalizedPath.endsWith('/.git') ||
        normalizedPath.split('/').pop()?.startsWith('.git')
    ) {
        return true;
    }

    const excludePaths = config.get<string[]>('excludePaths', [
        '**/.git/**',
        '**/node_modules/**'
    ]);

    for (const pattern of excludePaths) {
        if (matchesPattern(normalizedPath, pattern)) {
            return true;
        }
    }

    return false;
}

function matchesPattern(fsPath: string, pattern: string): boolean {
    const normalizedPath = fsPath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    
    if (normalizedPattern.includes('**')) {
        const parts = normalizedPattern.split('**');
        const escapedParts = parts.map(p => p.replace(/[.+^${}()|[\]\\]/g, '\\$&'));
        const regexStr = escapedParts.join('.*');
        const regex = new RegExp(regexStr.startsWith('.*') ? regexStr : `^${regexStr}`);
        return regex.test(normalizedPath);
    }
    
    const cleanPattern = normalizedPattern.replace(/\*/g, '');
    return normalizedPath.includes(cleanPattern);
}
