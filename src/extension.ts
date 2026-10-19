import * as fs from 'fs';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

/**
 * Expands `${workspaceFolder}` in a configured path.
 *
 * VS Code substitutes that variable in a few well-known settings (tasks, launch
 * configs) but not in arbitrary extension settings, so an extension that wants it has
 * to do the expansion itself. Without this the only workable value is an absolute path,
 * which cannot be shared: `lyra.code-workspace` is checked in, so a hardcoded
 * `/Users/<someone>/...` is wrong for everyone else who opens it.
 *
 * This is a multi-root workspace (the compiler, the extension, the grammar and the site
 * are separate folders), so `${workspaceFolder}` is ambiguous. Rather than inventing a
 * rule about which folder wins, each is tried in turn and the first whose expansion
 * actually exists on disk is used — a path that resolves is the one that was meant.
 * Falling back to the first folder keeps the behaviour predictable when none exist yet,
 * so the error names a real path instead of an unexpanded variable.
 */
function expandWorkspaceFolder(configured: string): string {
    if (!configured.includes('${workspaceFolder}')) {
        return configured;
    }
    const folders = vscode.workspace.workspaceFolders ?? [];
    if (folders.length === 0) {
        return configured;
    }
    const candidates = folders.map((f) =>
        configured.replace(/\$\{workspaceFolder\}/g, f.uri.fsPath),
    );
    return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}

export function activate(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('lyra');
    const configured = config.get<string>('languageServerPath', '').trim();
    const serverPath: string = expandWorkspaceFolder(configured) || 'lyra-lsp';

    const serverOptions: ServerOptions = {
        run: { command: serverPath, transport: TransportKind.stdio },
        debug: { command: serverPath, transport: TransportKind.stdio },
    };

    const clientOptions: LanguageClientOptions = {
        // `.lui` markup too: the server diagnoses it through the Lyra lui generates from it,
        // at the markup's own lines.
        documentSelector: [
            { scheme: 'file', language: 'lyra' },
            { scheme: 'file', language: 'lui' },
        ],
    };

    client = new LanguageClient(
        'lyra',
        'Lyra Language Server',
        serverOptions,
        clientOptions,
    );

    context.subscriptions.push(client);
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    return client?.stop();
}
