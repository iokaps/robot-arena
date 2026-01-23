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
