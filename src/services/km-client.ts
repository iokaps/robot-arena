import type { Config } from '@/config/schema';
import type { ClientContext } from '@/types/client';
import { KokimokiClient } from '@kokimoki/app';

/**
 * Kokimoki environment variables
 */
export const kmEnv: {
	dev: boolean;
	test: boolean;
	host: string;
	appId: string;
	code?: string;
	clientContext?: string;
	config?: string;
	configObject?: Config;
	base: string;
	assets: string;
} = JSON.parse(document.getElementById('kokimoki-env')!.textContent!);

/**
 * Kokimoki app configuration.
 * Used to get the app configuration from the environment variables.
 */
export function getConfig(): Config {
	if (kmEnv.configObject) {
		return kmEnv.configObject;
	}

	if (kmEnv.config) {
		return JSON.parse(kmEnv.config);
	}

	throw new Error('No Kokimoki config provided');
}

/**
 * Kokimoki client to interact with the Kokimoki SDK platform.
 * Used to manage the app state, interact with the Kokimoki services,
 * provices access to the client context and more.
 *
 * @returns Kokimoki client instance
 */
export const kmClient = new KokimokiClient<ClientContext>(
	kmEnv.host,
	kmEnv.appId,
	kmEnv.code
);

function removeKokimokiLoadingWhenAppRenders(): void {
	const rootElement = document.getElementById('root');

	if (!rootElement) {
		return;
	}

	const removeLoading = () => {
		if (rootElement.childElementCount === 0) {
			return false;
		}

		document.getElementById('km-loading')?.remove();
		return true;
	};

	if (removeLoading()) {
		return;
	}

	const observer = new MutationObserver(() => {
		if (removeLoading()) {
			observer.disconnect();
		}
	});

	observer.observe(rootElement, { childList: true });
}

removeKokimokiLoadingWhenAppRenders();

function getDeployCode(): string | undefined {
	if (kmEnv.code && !kmEnv.code.startsWith('%KM')) {
		return kmEnv.code;
	}

	const pathSegments = window.location.pathname.split('/').filter(Boolean);
	return pathSegments.at(-1);
}

function normalizeClientContext(context: unknown): ClientContext | null {
	if (typeof context === 'string') {
		const trimmedContext = context.trim();

		if (!trimmedContext || trimmedContext.startsWith('%KM')) {
			return null;
		}

		try {
			return normalizeClientContext(JSON.parse(trimmedContext));
		} catch {
			return null;
		}
	}

	if (!context || typeof context !== 'object') {
		return null;
	}

	const mode = (context as { mode?: unknown }).mode;

	if (mode === 'player') {
		return { mode };
	}

	if (mode === 'presenter') {
		const playerCode = (context as { playerCode?: unknown }).playerCode;

		return {
			mode,
			playerCode: typeof playerCode === 'string' ? playerCode : 'player'
		};
	}

	if (mode === 'host') {
		const playerCode = (context as { playerCode?: unknown }).playerCode;
		const presenterCode = (context as { presenterCode?: unknown })
			.presenterCode;

		return {
			mode,
			playerCode: typeof playerCode === 'string' ? playerCode : 'player',
			presenterCode:
				typeof presenterCode === 'string' ? presenterCode : 'presenter'
		};
	}

	return null;
}

function getClientContextFallback(): ClientContext | null {
	const envContext = normalizeClientContext(kmEnv.clientContext);

	if (envContext) {
		return envContext;
	}

	switch (getDeployCode()) {
		case 'host':
			return {
				mode: 'host',
				playerCode: 'player',
				presenterCode: 'presenter'
			};
		case 'presenter':
			return { mode: 'presenter', playerCode: 'player' };
		case 'player':
			return { mode: 'player' };
		default:
			return null;
	}
}

function setClientContext(context: ClientContext): void {
	(kmClient as unknown as { _clientContext: ClientContext })._clientContext =
		context;
}

const originalConnect = kmClient.connect.bind(kmClient);

kmClient.connect = async () => {
	await originalConnect();

	if (kmClient.clientContext !== null) {
		return;
	}

	const fallbackContext = getClientContextFallback();

	if (!fallbackContext) {
		return;
	}

	setClientContext(fallbackContext);
};
