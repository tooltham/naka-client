import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BASE_URL, QUICK_ENDPOINTS } from './constants';

export function activate(context: vscode.ExtensionContext) {
	console.log('NAKA Client extension is now active!');

	const disposable = vscode.commands.registerCommand('naka-client.open', () => {
		// Create and show the Webview panel
		const panel = vscode.window.createWebviewPanel(
			'nakaClient',
			'NAKA Client',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(context.extensionPath, 'media'))
				]
			}
		);

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'saveApiKey':
						await context.secrets.store('nakaApiKey', message.key);
						panel.webview.postMessage({ command: 'apiKeySaved' });
						return;
					case 'loadApiKey':
						const storedKey = await context.secrets.get('nakaApiKey');
						panel.webview.postMessage({ command: 'apiKeyLoaded', key: storedKey || '' });
						return;
					case 'doFetch':
						const start = Date.now();
						try {
							const response = await fetch(message.url, {
								method: message.method || 'GET',
								headers: message.headers
							});
							const text = await response.text();
							panel.webview.postMessage({
								command: 'doFetchResponse',
								id: message.id,
								ok: response.ok,
								status: response.status,
								statusText: response.statusText,
								text: text,
								time: Date.now() - start
							});
						} catch (err: any) {
							panel.webview.postMessage({
								command: 'doFetchError',
								id: message.id,
								error: err.message || String(err),
								time: Date.now() - start
							});
						}
						return;
				}
			},
			undefined,
			context.subscriptions
		);

		// Set the HTML content
		panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
	// Local path to main script run in the webview
	const scriptPathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'main.js');
	const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

	// Local path to styles
	const stylePathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'style.css');
	const styleUri = webview.asWebviewUri(stylePathOnDisk);

	// Local path to the HTML template
	const htmlPath = path.join(extensionUri.fsPath, 'media', 'view.html');
	let html = fs.readFileSync(htmlPath, 'utf8');

	// Create a nonce for CSP
	const nonce = getNonce();

	// Replace placeholders in the HTML
	html = html.replace(/\${styleUri}/g, styleUri.toString());
	html = html.replace(/\${scriptUri}/g, scriptUri.toString());
	html = html.replace(/\${cspSource}/g, webview.cspSource);
	html = html.replace(/\${nonce}/g, nonce);
	html = html.replace(/\${base}/g, BASE_URL);
	html = html.replace(/\${quickEndpointsJson}/g, JSON.stringify(QUICK_ENDPOINTS));

	return html;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
