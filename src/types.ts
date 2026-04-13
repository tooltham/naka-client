/**
 * Messages sent from the Webview back to the Extension Host.
 */
export type WebviewMessage =
	| { command: 'saveApiKey'; key: string }
	| { command: 'loadApiKey' }
	| { 
		command: 'doFetch'; 
		id: number; 
		url: string; 
		method: string; 
		headers: Record<string, string>;
	};

/**
 * Messages sent from the Extension Host to the Webview.
 */
export type HostMessage =
	| { command: 'apiKeySaved' }
	| { command: 'apiKeyLoaded'; key: string }
	| { 
		command: 'doFetchResponse'; 
		id: number; 
		ok: boolean; 
		status: number; 
		statusText: string; 
		text: string; 
		time: number; 
	}
	| { 
		command: 'doFetchError'; 
		id: number; 
		error: string; 
		time: number; 
	};
