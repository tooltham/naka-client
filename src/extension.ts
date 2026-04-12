// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// This method is called when your extension is activated
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
		panel.webview.html = getWebviewContent();
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(): string {
	return /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NAKA Client</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ─── NPU Design Tokens ─── */
    :root {
      --npu-navy:        #0d2750;
      --npu-navy-light:  #1a3f6f;
      --npu-blue:        #2b6cb0;
      --npu-blue-pale:   #ebf4ff;
      --npu-gold:        #c8a415;
      --npu-gold-light:  #e0c846;
      --npu-gold-pale:   #fefce8;
      --color-bg:        #f0f4f9;
      --color-surface:   #ffffff;
      --color-surface-2: #f7fafd;
      --color-text:      #1a2332;
      --color-text-2:    #4a5c70;
      --color-text-3:    #8a9bb0;
      --color-border:    #dae3ef;
      --color-border-2:  #c2d0e0;
      --color-success:   #00b050;
      --color-danger:    #e53e3e;
      --color-warning:   #ff7e00;
      --color-info:      #2b6cb0;
      --shadow-xs:  0 1px 2px rgba(13,39,80,.05);
      --shadow-sm:  0 2px 6px rgba(13,39,80,.07);
      --shadow-md:  0 4px 16px rgba(13,39,80,.10);
      --shadow-lg:  0 8px 28px rgba(13,39,80,.13);
      --radius-xs:  4px;
      --radius-sm:  8px;
      --radius-md:  12px;
      --radius-lg:  16px;
      --font-sans:  'Inter', 'Segoe UI', system-ui, sans-serif;
      --font-mono:  'JetBrains Mono', 'Fira Code', monospace;
    }

    body {
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
    }

    /* ─── Scrollbar ─── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--color-border-2); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--npu-blue); }

    /* ─── Topbar / Navbar ─── */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--npu-navy);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      height: 52px;
      box-shadow: 0 2px 12px rgba(13,39,80,.25);
    }

    .topbar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .topbar-emblem {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--npu-gold) 0%, var(--npu-gold-light) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(200,164,21,.4);
      color: var(--npu-navy);
    }
    .topbar-emblem svg { width: 17px; height: 17px; }

    .topbar-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.2px;
      line-height: 1.1;
    }

    .topbar-sub {
      font-size: 0.62rem;
      font-weight: 500;
      color: var(--npu-gold-light);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .topbar-spacer { flex: 1; }

    .topbar-badge {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--npu-gold-light);
      background: rgba(200,164,21,.18);
      border: 1px solid rgba(200,164,21,.35);
      border-radius: 20px;
      padding: 2px 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ─── Main Layout ─── */
    .main {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 20px 48px;
    }

    /* ─── Section Title ─── */
    .section-title {
      font-size: .7rem;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--npu-navy-light);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }

    /* ─── Card ─── */
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .card-body { padding: 18px 20px; }

    /* ─── API Key Strip ─── */
    .apikey-strip {
      background: var(--npu-navy);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-md);
    }

    .apikey-strip label {
      font-size: .72rem;
      font-weight: 700;
      color: var(--npu-gold-light);
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .apikey-input {
      flex: 1;
      background: rgba(255,255,255,.09);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: var(--radius-sm);
      padding: 8px 14px;
      color: #fff;
      font-family: var(--font-mono);
      font-size: .8rem;
      outline: none;
      transition: border-color .18s, box-shadow .18s;
    }
    .apikey-input::placeholder { color: rgba(255,255,255,.35); }
    .apikey-input:focus {
      border-color: var(--npu-gold);
      box-shadow: 0 0 0 3px rgba(200,164,21,.22);
    }

    .apikey-save-btn {
      background: linear-gradient(135deg, var(--npu-gold) 0%, var(--npu-gold-light) 100%);
      color: var(--npu-navy);
      border: none;
      border-radius: var(--radius-sm);
      padding: 8px 18px;
      font-family: var(--font-sans);
      font-size: .82rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity .15s, transform .1s;
      box-shadow: 0 2px 8px rgba(200,164,21,.35);
    }
    .apikey-save-btn:hover { opacity: .88; }
    .apikey-save-btn:active { transform: scale(.97); }

    .apikey-status {
      font-size: .72rem;
      font-weight: 600;
      white-space: nowrap;
      min-width: 60px;
    }
    .apikey-status.saved  { color: var(--color-success); }
    .apikey-status.unsaved { color: rgba(255,255,255,.4); }

    /* ─── Quick Endpoints ─── */
    .qe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }

    .qe-btn {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      cursor: pointer;
      text-align: left;
      transition: border-color .15s, box-shadow .15s, background .15s;
      font-family: var(--font-sans);
    }
    .qe-btn:hover {
      border-color: var(--npu-blue);
      box-shadow: 0 0 0 3px var(--npu-blue-pale);
      background: var(--npu-blue-pale);
    }
    .qe-btn.active {
      border-color: var(--npu-navy-light);
      background: var(--npu-blue-pale);
      box-shadow: 0 0 0 3px rgba(43,108,176,.12);
    }

    .qe-icon {
      font-size: 1.3rem;
      line-height: 1;
      margin-top: 1px;
      flex-shrink: 0;
    }

    .qe-info { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }

    .qe-name {
      font-size: .78rem;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .qe-path {
      font-family: var(--font-mono);
      font-size: .67rem;
      color: var(--npu-blue);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .qe-method {
      font-size: .6rem;
      font-weight: 700;
      letter-spacing: .5px;
      color: var(--color-success);
      background: rgba(0,176,80,.1);
      border-radius: 4px;
      padding: 1px 6px;
      align-self: flex-start;
    }

    /* ─── Request Row ─── */
    .request-row {
      display: flex;
      gap: 8px;
      align-items: stretch;
      margin-bottom: 16px;
    }

    .method-pill {
      background: var(--npu-navy);
      color: var(--npu-gold-light);
      border: none;
      border-radius: var(--radius-sm);
      padding: 0 14px;
      font-family: var(--font-mono);
      font-size: .75rem;
      font-weight: 600;
      letter-spacing: .5px;
      display: flex;
      align-items: center;
      white-space: nowrap;
    }

    .url-input {
      flex: 1;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      color: var(--color-text);
      font-family: var(--font-mono);
      font-size: .8rem;
      outline: none;
      transition: border-color .18s, box-shadow .18s;
      min-width: 0;
    }
    .url-input::placeholder { color: var(--color-text-3); }
    .url-input:focus {
      border-color: var(--npu-blue);
      box-shadow: 0 0 0 3px var(--npu-blue-pale);
    }

    .shoot-btn {
      display: flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(135deg, var(--npu-navy-light) 0%, var(--npu-blue) 100%);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      padding: 10px 20px;
      font-family: var(--font-sans);
      font-size: .85rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      letter-spacing: .2px;
      box-shadow: 0 3px 12px rgba(13,39,80,.28);
      transition: box-shadow .18s, transform .1s, opacity .15s;
    }
    .shoot-btn:hover {
      box-shadow: 0 5px 18px rgba(13,39,80,.38);
      opacity: .95;
    }
    .shoot-btn:active { transform: scale(.97); }
    .shoot-btn:disabled {
      background: var(--color-border);
      color: var(--color-text-3);
      box-shadow: none;
      cursor: not-allowed;
    }

    /* Spinner */
    .spinner {
      display: none;
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .65s linear infinite;
    }
    .shoot-btn.loading .spinner  { display: block; }
    .shoot-btn.loading .btn-icon { display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Headers Section ─── */
    .headers-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .field-group label {
      display: block;
      font-size: .68rem;
      font-weight: 700;
      letter-spacing: .8px;
      text-transform: uppercase;
      color: var(--color-text-3);
      margin-bottom: 5px;
    }

    .field-input {
      width: 100%;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      color: var(--color-text);
      font-family: var(--font-mono);
      font-size: .78rem;
      outline: none;
      transition: border-color .18s, box-shadow .18s;
    }
    .field-input::placeholder { color: var(--color-text-3); }
    .field-input:focus {
      border-color: var(--npu-blue);
      box-shadow: 0 0 0 3px var(--npu-blue-pale);
    }

    /* ─── Response Area ─── */
    .response-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--color-surface-2);
      border-bottom: 1px solid var(--color-border);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
    }

    .response-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .resp-tab {
      font-size: .67rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--npu-navy-light);
      padding: 3px 10px;
      border-radius: 20px;
      background: var(--npu-blue-pale);
      border: 1px solid rgba(43,108,176,.2);
    }

    .status-pill {
      display: none;
      align-items: center;
      gap: 5px;
      font-size: .72rem;
      font-weight: 600;
      border-radius: 20px;
      padding: 3px 12px;
    }
    .status-pill.ok  {
      display: inline-flex;
      background: rgba(0,176,80,.1);
      border: 1px solid rgba(0,176,80,.3);
      color: var(--color-success);
    }
    .status-pill.err {
      display: inline-flex;
      background: rgba(229,62,62,.1);
      border: 1px solid rgba(229,62,62,.3);
      color: var(--color-danger);
    }
    .resp-time {
      font-size: .7rem;
      color: var(--color-text-3);
      font-family: var(--font-mono);
    }

    .copy-btn {
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xs);
      padding: 4px 12px;
      font-size: .7rem;
      font-weight: 600;
      color: var(--color-text-2);
      cursor: pointer;
      font-family: var(--font-sans);
      transition: all .15s;
    }
    .copy-btn:hover {
      border-color: var(--npu-blue);
      color: var(--npu-blue);
      background: var(--npu-blue-pale);
    }

    .response-body {
      padding: 16px;
      font-family: var(--font-mono);
      font-size: .78rem;
      line-height: 1.75;
      white-space: pre-wrap;
      word-break: break-all;
      min-height: 200px;
      max-height: 460px;
      overflow-y: auto;
      color: var(--color-text);
    }

    /* JSON Colors — light theme */
    .jk { color: #1a3f6f; font-weight: 500; }   /* key */
    .js { color: #0d7a3e; }   /* string */
    .jn { color: #b45309; }   /* number */
    .jb { color: #7c3aed; }   /* bool */
    .jz { color: #9ca3af; }   /* null */

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 10px;
      color: var(--color-text-3);
    }
    .empty-state .em-icon { font-size: 2.2rem; opacity: .5; }
    .empty-state p { font-size: .82rem; text-align: center; }

    /* ─── Station Cards ─── */
    .station-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px;
      margin-top: 4px;
    }

    .station-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px;
      box-shadow: var(--shadow-xs);
      transition: box-shadow .18s, border-color .18s;
    }
    .station-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-border-2);
    }

    .station-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .station-id {
      font-family: var(--font-mono);
      font-size: .68rem;
      font-weight: 500;
      color: var(--npu-blue);
      background: var(--npu-blue-pale);
      border-radius: 4px;
      padding: 2px 8px;
    }

    .aqi-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 3px;
    }

    .station-name {
      font-size: .88rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .station-location {
      font-size: .72rem;
      color: var(--color-text-2);
      margin-bottom: 12px;
    }

    .pm25-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 2px;
    }

    .pm25-value {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -1px;
    }

    .pm25-unit {
      font-size: .7rem;
      color: var(--color-text-2);
      align-self: flex-end;
      padding-bottom: 4px;
    }

    .pm25-label {
      font-size: .65rem;
      font-weight: 600;
      letter-spacing: .5px;
      color: var(--color-text-3);
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .sensor-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .sensor-chip {
      font-size: .68rem;
      color: var(--color-text-2);
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 2px 10px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .station-footer {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .station-time {
      font-size: .65rem;
      color: var(--color-text-3);
      font-family: var(--font-mono);
    }

    .use-btn {
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xs);
      padding: 3px 10px;
      font-size: .68rem;
      font-weight: 600;
      color: var(--npu-blue);
      cursor: pointer;
      transition: all .15s;
      font-family: var(--font-sans);
    }
    .use-btn:hover {
      background: var(--npu-blue);
      color: #fff;
      border-color: var(--npu-blue);
    }

    /* Loading skeleton */
    .skeleton {
      background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface-2) 50%, var(--color-border) 75%);
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
      border-radius: 6px;
      height: 14px;
    }
    @keyframes shimmer { to { background-position: -400% 0; } }

    /* ─── Layout helpers ─── */
    .mb-16 { margin-bottom: 16px; }
    .mb-20 { margin-bottom: 20px; }
    .mb-8  { margin-bottom: 8px; }
    .row   { display: flex; gap: 12px; align-items: center; justify-content: space-between; }

    /* ─── Toast ─── */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--npu-navy);
      color: #fff;
      border-radius: var(--radius-sm);
      padding: 10px 18px;
      font-size: .8rem;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity .2s, transform .2s;
      pointer-events: none;
      z-index: 999;
    }
    .toast.show { opacity: 1; transform: translateY(0); }

    /* ─── Footer ─── */
    .app-footer {
      text-align: center;
      padding: 16px 20px 10px;
      margin-top: 16px;
      border-top: 1px solid var(--color-border);
      color: var(--color-text-3);
      font-size: .68rem;
      line-height: 1.6;
    }
    .app-footer strong {
      color: var(--npu-navy-light);
      font-weight: 600;
      letter-spacing: .2px;
    }
    .app-footer a {
      color: var(--npu-blue);
      text-decoration: none;
    }
    .app-footer a:hover {
      text-decoration: underline;
    }
    .footer-dot { margin: 0 6px; opacity: .5; }

    /* AQI colors */
    /* AQI colors */
    .aqi-verygood    { color: #00b0f0; }
    .aqi-good        { color: #00b050; }
    .aqi-moderate    { color: #e0c846; }
    .aqi-usg         { color: #ff7e00; }
    .aqi-unhealthy   { color: #e53e3e; }
    .aqi-hazardous   { color: #8f3f97; }

    .dot-verygood    { background: #00b0f0; }
    .dot-good        { background: #00b050; }
    .dot-moderate    { background: #e0c846; }
    .dot-usg         { background: #ff7e00; }
    .dot-unhealthy   { background: #e53e3e; }
    .dot-hazardous   { background: #8f3f97; }
  </style>
</head>
<body>

  <!-- ── Topbar ── -->
  <nav class="topbar">
    <div class="topbar-logo">
      <div class="topbar-emblem">
        <!-- API / Key Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="7.5" cy="15.5" r="5.5"></circle>
          <path d="m21 2-9.6 9.6"></path>
          <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
        </svg>
      </div>
      <div>
        <div class="topbar-title">NAKA Client</div>
        <div class="topbar-sub">Nakhon Phanom AQI · VS Code</div>
      </div>
    </div>
    <div class="topbar-spacer"></div>
    <span class="topbar-badge">FF69 · NPU</span>
  </nav>

  <!-- ── Main ── -->
  <div class="main">

    <!-- API Key Strip -->
    <div class="apikey-strip mb-20">
      <label>🔑 API KEY</label>
      <input id="apikeyInput" class="apikey-input" type="password"
        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
        autocomplete="off" spellcheck="false" />
      <button class="apikey-save-btn" onclick="saveApiKey()">Save</button>
      <span id="apikeyStatus" class="apikey-status unsaved">— not set</span>
    </div>

    <!-- Quick Endpoints -->
    <div class="section-title mb-8">Quick Endpoints</div>
    <div class="qe-grid mb-20" id="qeGrid">
      <!-- Populated by JS -->
    </div>

    <!-- Request Card -->
    <div class="section-title mb-8">Request</div>
    <div class="card mb-20">
      <div class="card-body">

        <!-- URL Row -->
        <div class="request-row">
          <div class="method-pill">GET</div>
          <input id="urlInput" class="url-input"
            type="text"
            placeholder="https://naka-env.org/api/stations"
            autocomplete="off" spellcheck="false" />
          <button id="shootBtn" class="shoot-btn" onclick="sendRequest()">
            <span class="spinner"></span>
            <span class="btn-icon">🚀</span>
            Shoot!
          </button>
        </div>

        <!-- Extra Fields -->
        <div class="headers-row">
          <div class="field-group">
            <label>Station ID (optional)</label>
            <input id="stationIdInput" class="field-input"
              type="text" placeholder="e.g. ST001"
              oninput="buildUrl()" />
          </div>
          <div class="field-group">
            <label>Sub-path (optional)</label>
            <input id="subpathInput" class="field-input"
              type="text" placeholder="e.g. history?hours=24"
              oninput="buildUrl()" />
          </div>
        </div>

      </div>
    </div>

    <!-- Response Card -->
    <div class="section-title mb-8">Response</div>
    <div class="card mb-20">
      <div class="response-header">
        <div class="response-header-left">
          <span class="resp-tab">JSON</span>
          <span id="statusPill" class="status-pill"></span>
          <span id="respTime" class="resp-time"></span>
        </div>
        <button class="copy-btn" onclick="copyResponse()">Copy</button>
      </div>
      <div id="responseBody" class="response-body">
        <div class="empty-state">
          <span class="em-icon">📡</span>
          <p>เลือก Endpoint หรือพิมพ์ URL แล้วกด Shoot!<br>Response จะแสดงที่นี่</p>
        </div>
      </div>
    </div>

    <!-- Station Cards -->
    <div id="stationSection" style="display:none">
      <div class="section-title mb-8" id="stationSectionTitle">Stations</div>
      <div class="station-grid" id="stationGrid"></div>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <div>Developed by <strong>Internet of Things and Embedded System Research Unit (IoTES)</strong> <span class="footer-dot">•</span> <strong>Nakhon Phanom University</strong></div>
      <div style="margin-top:4px;">NAKA Client Extension for <a href="https://naka-env.org" target="_blank">naka-env.org</a> API.</div>
    </footer>

  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script>
    /* ─── Config ─── */
    const BASE = 'https://naka-env.org/api';

    const QUICK_ENDPOINTS = [
      {
        icon: '🏭',
        name: 'All Stations',
        path: '/stations',
        method: 'GET',
        stationId: '',
        sub: '',
        showCards: true,
      },
      {
        icon: '📍',
        name: 'Station Current',
        path: '/stations/{id}/current',
        method: 'GET',
        stationId: 'ST001',
        sub: 'current',
        showCards: false,
      },
      {
        icon: '📈',
        name: 'History 24h',
        path: '/stations/{id}/history',
        method: 'GET',
        stationId: 'ST001',
        sub: 'history?start={start_24h}&end={end_now}',
        showCards: false,
      },
      {
        icon: '📅',
        name: 'History 7 Days',
        path: '/stations/{id}/history',
        method: 'GET',
        stationId: 'ST001',
        sub: 'history?start={start_168h}&end={end_now}',
        showCards: false,
      },
      {
        icon: '🗓️',
        name: 'Monthly',
        path: '/stations/{id}/monthly',
        method: 'GET',
        stationId: 'ST001',
        sub: 'monthly?{current_month}',
        showCards: false,
      },
      {
        icon: '🔑',
        name: 'My API Key',
        path: '/keys/me',
        method: 'GET',
        stationId: '',
        sub: '',
        fullUrl: BASE + '/keys/me',
        showCards: false,
      },
    ];

    /* ─── State ─── */
    let rawResponse = '';
    let currentEndpoint = null;
    const vscode = acquireVsCodeApi();

    /* ─── Init ─── */
    document.addEventListener('DOMContentLoaded', () => {
      renderQuickEndpoints();
      vscode.postMessage({ command: 'loadApiKey' });

      document.getElementById('urlInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendRequest();
      });
    });

    let currentFetchId = 0;
    const fetchPromises = {};

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.command === 'apiKeyLoaded') {
        if (msg.key) {
          document.getElementById('apikeyInput').value = msg.key;
          setApikeyStatus(true);
        }
      }
      if (msg.command === 'apiKeySaved') {
        setApikeyStatus(true);
        showToast('✅ API Key saved');
      }
      if (msg.command === 'doFetchResponse' || msg.command === 'doFetchError') {
        if (fetchPromises[msg.id]) {
          fetchPromises[msg.id](msg);
          delete fetchPromises[msg.id];
        }
      }
    });

    /* ─── Quick Endpoints ─── */
    function renderQuickEndpoints() {
      const grid = document.getElementById('qeGrid');
      grid.innerHTML = QUICK_ENDPOINTS.map((ep, i) => \`
        <button class="qe-btn" id="qe-\${i}" onclick="selectEndpoint(\${i})">
          <span class="qe-icon">\${ep.icon}</span>
          <div class="qe-info">
            <span class="qe-method">\${ep.method}</span>
            <span class="qe-name">\${ep.name}</span>
            <span class="qe-path">\${ep.path}</span>
          </div>
        </button>
      \`).join('');
    }

    function selectEndpoint(idx) {
      // Toggle active
      document.querySelectorAll('.qe-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('qe-' + idx).classList.add('active');

      const ep = QUICK_ENDPOINTS[idx];
      currentEndpoint = ep;

      let sub = ep.sub || '';
      const now = new Date();

      if (sub.includes('{end_now}')) {
        const endStr = encodeURIComponent(now.toISOString());
        let past = new Date();
        if (sub.includes('{start_24h}')) {
          past = new Date(now.getTime() - 24 * 3600 * 1000);
          sub = sub.replace('{start_24h}', encodeURIComponent(past.toISOString()));
        } else if (sub.includes('{start_168h}')) {
          past = new Date(now.getTime() - 168 * 3600 * 1000);
          sub = sub.replace('{start_168h}', encodeURIComponent(past.toISOString()));
        }
        sub = sub.replace('{end_now}', endStr);
      } else if (sub.includes('{current_month}')) {
        sub = sub.replace('{current_month}', \`year=\${now.getFullYear()}&month=\${now.getMonth() + 1}\`);
      }

      // Populate fields
      document.getElementById('stationIdInput').value = ep.stationId || '';
      document.getElementById('subpathInput').value   = sub;

      if (ep.fullUrl) {
        document.getElementById('urlInput').value = ep.fullUrl;
      } else {
        buildUrl();
      }
    }

    function buildUrl() {
      const stationId = document.getElementById('stationIdInput').value.trim();
      const sub       = document.getElementById('subpathInput').value.trim();

      let url = BASE + '/stations';
      if (stationId) url += '/' + stationId;
      if (sub) url += '/' + sub;

      document.getElementById('urlInput').value = url;
    }

    /* ─── API Key ─── */
    function saveApiKey() {
      const key = document.getElementById('apikeyInput').value.trim();
      if (!key) { showToast('⚠️ กรุณาใส่ API Key'); return; }
      vscode.postMessage({ command: 'saveApiKey', key });
    }

    function setApikeyStatus(saved) {
      const el = document.getElementById('apikeyStatus');
      if (saved) {
        el.textContent = '✓ saved';
        el.className = 'apikey-status saved';
      } else {
        el.textContent = '— not set';
        el.className = 'apikey-status unsaved';
      }
    }

    function getApiKey() {
      return document.getElementById('apikeyInput').value.trim();
    }

    /* ─── Send Request ─── */
    async function sendRequest() {
      const url = document.getElementById('urlInput').value.trim();
      if (!url) { flashField('urlInput'); return; }

      const btn        = document.getElementById('shootBtn');
      const statusPill = document.getElementById('statusPill');
      const respTime   = document.getElementById('respTime');
      const respBody   = document.getElementById('responseBody');

      btn.classList.add('loading');
      btn.disabled = true;
      statusPill.className = 'status-pill';
      respTime.textContent = '';
      respBody.innerHTML = '<div class="empty-state"><span class="em-icon">⏳</span><p>กำลังส่ง Request…</p></div>';

      const apiKey   = getApiKey();
      const headers  = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;

      const fetchId = ++currentFetchId;
      
      const p = new Promise(resolve => {
        fetchPromises[fetchId] = resolve;
      });

      vscode.postMessage({
        command: 'doFetch',
        id: fetchId,
        url: url,
        method: currentEndpoint ? currentEndpoint.method : 'GET',
        headers: headers
      });

      try {
        const res = await p;
        if (res.command === 'doFetchError') {
          throw new Error(res.error);
        }
        
        const text = res.text;
        rawResponse = text;

        if (res.ok) {
          statusPill.className = 'status-pill ok';
          statusPill.textContent = '✓ ' + res.status + ' ' + res.statusText;
        } else {
          statusPill.className = 'status-pill err';
          statusPill.textContent = '✕ ' + res.status + ' ' + res.statusText;
        }
        respTime.textContent = res.time + ' ms';

        try {
          const json  = JSON.parse(text);
          rawResponse = JSON.stringify(json, null, 2);
          respBody.innerHTML = '<pre>' + syntaxHL(rawResponse) + '</pre>';

          if (currentEndpoint?.showCards && res.ok && Array.isArray(json)) {
            renderStationCards(json);
          } else {
            document.getElementById('stationSection').style.display = 'none';
          }
        } catch {
          respBody.textContent = text;
        }

      } catch (err) {
        rawResponse = String(err);
        statusPill.className = 'status-pill err';
        statusPill.textContent = '✕ Network Error / CORS';
        respTime.textContent = '?? ms';
        respBody.innerHTML = '<div class="empty-state"><span class="em-icon">❌</span><p>' + escHtml(String(err)) + '</p></div>';
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    }

    /* ─── Station Cards ─── */
    function renderStationCards(stations) {
      const section = document.getElementById('stationSection');
      const grid    = document.getElementById('stationGrid');
      const title   = document.getElementById('stationSectionTitle');

      title.textContent = 'Stations Overview (' + stations.length + ')';
      section.style.display = 'block';

      grid.innerHTML = stations.map(s => {
        const latest = s.latest || {};
        const pm25   = latest.pm25 != null ? Number(latest.pm25) : null;
        const { cls, dotCls, label } = aqiLevel(pm25);

        const ts = latest.timestamp
          ? new Date(latest.timestamp).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })
          : '--:--';

        return \`
          <div class="station-card">
            <div class="station-card-top">
              <span class="station-id">\${escHtml(s.station_id || '—')}</span>
              <span class="aqi-dot \${dotCls}" title="\${label}"></span>
            </div>
            <div class="station-name" title="\${escHtml(s.name || '')}">
              \${escHtml(s.name || 'Unknown Station')}
            </div>
            <div class="station-location">📍 \${escHtml(s.district || '')} · \${escHtml(s.province || '')}</div>
            <div class="pm25-row">
              <span class="pm25-value \${cls}">
                \${pm25 != null ? pm25.toFixed(1) : '—'}
              </span>
              <span class="pm25-unit">µg/m³</span>
            </div>
            <div class="pm25-label">PM2.5 · \${label}</div>
            <div class="sensor-row">
              \${latest.pm10 != null     ? '<span class="sensor-chip">PM10 ' + Number(latest.pm10).toFixed(1) + '</span>' : ''}
              \${latest.temperature != null ? '<span class="sensor-chip">🌡 ' + Number(latest.temperature).toFixed(1) + '°C</span>' : ''}
              \${latest.humidity != null ? '<span class="sensor-chip">💧 ' + Number(latest.humidity).toFixed(0) + '%</span>' : ''}
            </div>
            <div class="station-footer">
              <span class="station-time">🕐 \${ts}</span>
              <button class="use-btn" onclick="useStation('\${escHtml(s.station_id || '')}')">Use</button>
            </div>
          </div>
        \`;
      }).join('');
    }

    function useStation(id) {
      document.getElementById('stationIdInput').value = id;
      document.getElementById('subpathInput').value   = 'current';
      buildUrl();
      showToast('📍 Set to ' + id);
    }

    /* ─── AQI Helper ─── */
    function aqiLevel(pm25) {
      if (pm25 == null) return { cls: '', dotCls: '', label: 'N/A' };
      if (pm25 <= 15)   return { cls: 'aqi-verygood',  dotCls: 'dot-verygood',  label: 'Very Good' };
      if (pm25 <= 25)   return { cls: 'aqi-good',      dotCls: 'dot-good',      label: 'Good' };
      if (pm25 <= 37.5) return { cls: 'aqi-moderate',  dotCls: 'dot-moderate',  label: 'Moderate' };
      if (pm25 <= 75)   return { cls: 'aqi-usg',       dotCls: 'dot-usg',       label: 'Unhealthy for SGP' };
      if (pm25 <= 100)  return { cls: 'aqi-unhealthy', dotCls: 'dot-unhealthy', label: 'Unhealthy' };
      return { cls: 'aqi-hazardous', dotCls: 'dot-hazardous', label: 'Hazardous' };
    }

    /* ─── Utilities ─── */
    function syntaxHL(json) {
      const s = json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return s.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (m) => {
          let c = 'jn';
          if (/^"/.test(m)) c = /:$/.test(m) ? 'jk' : 'js';
          else if (/true|false/.test(m)) c = 'jb';
          else if (/null/.test(m)) c = 'jz';
          return '<span class="' + c + '">' + m + '</span>';
        }
      );
    }

    function escHtml(str) {
      return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function copyResponse() {
      if (!rawResponse) return;
      navigator.clipboard.writeText(rawResponse).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    }

    function flashField(id) {
      const el = document.getElementById(id);
      el.style.borderColor  = 'var(--color-danger)';
      el.style.boxShadow    = '0 0 0 3px rgba(229,62,62,.18)';
      el.focus();
      setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1000);
    }

    let toastTimer;
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    }
  </script>
</body>
</html>
`;
}
