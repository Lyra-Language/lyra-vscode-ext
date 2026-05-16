import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('lyra');
    const serverPath: string = config.get<string>('languageServerPath', '').trim() || 'lyra-lsp';

    const serverOptions: ServerOptions = {
        run: { command: serverPath, transport: TransportKind.stdio },
        debug: { command: serverPath, transport: TransportKind.stdio },
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'lyra' }],
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
