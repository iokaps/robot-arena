import {
	KmAudioProvider,
	KmConfettiProvider,
	KmModalProvider
} from '@kokimoki/shared';
import type { ComponentType } from 'react';

/**
 * HOC that wraps a component with all Kokimoki shared providers.
 * Providers included: KmAudioProvider, KmConfettiProvider, KmModalProvider
 *
 * Example component demonstrating how to wrap components with providers.
 * Modify or replace with your own implementation.
 *
 * @param Component The component to be wrapped with Kokimoki providers.
 *
 * @example
 * export default withKmProviders(App);
 */
export function withKmProviders<P extends object>(Component: ComponentType<P>) {
	const displayName = Component.displayName || Component.name || 'Component';

	function WithKmProviders(props: P) {
		return (
			<KmAudioProvider>
				<KmConfettiProvider>
					<KmModalProvider>
						<Component {...props} />
					</KmModalProvider>
				</KmConfettiProvider>
			</KmAudioProvider>
		);
	}

	WithKmProviders.displayName = `withKmProviders(${displayName})`;

	return WithKmProviders;
}
