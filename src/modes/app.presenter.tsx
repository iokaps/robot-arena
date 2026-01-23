import {
	withModeGuard,
	type ModeGuardProps
} from '@/components/with-mode-guard';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { gameConfigStore } from '@/state/stores/game-config-store';
import { cn } from '@/utils/cn';
import { ConnectionsView } from '@/views/connections-view';
import { useSnapshot } from '@kokimoki/app';
import { KmQrCode } from '@kokimoki/shared';

function App({ clientContext }: ModeGuardProps<'presenter'>) {
	useGlobalController();
	useDocumentTitle(config.title);

	const { showPresenterQr } = useSnapshot(gameConfigStore.proxy);

	const playerLink = generateLink(clientContext.playerCode, {
		mode: 'player'
	});

	return (
		<>
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header />

				<HostPresenterLayout.Main>
					<ConnectionsView>
						<KmQrCode
							data={playerLink}
							size={200}
							className={cn({ invisible: !showPresenterQr })}
						/>
					</ConnectionsView>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		</>
	);
}

export default withModeGuard(App, 'presenter');
