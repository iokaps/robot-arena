import { HostControls } from '@/components/host/host-controls';
import {
	type ModeGuardProps,
	withModeGuard
} from '@/components/with-mode-guard';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { gameSessionActions } from '@/state/actions/game-session-actions';
import { gameSessionStore } from '@/state/stores/game-session-store';
import { GameStateView } from '@/views/game-state-view';
import { useSnapshot } from '@kokimoki/app';
import { CirclePlay, CircleStop, SquareArrowOutUpRight } from 'lucide-react';
import * as React from 'react';

function App({ clientContext }: ModeGuardProps<'host'>) {
	useDocumentTitle(config.title);
	useGlobalController();

	const { started } = useSnapshot(gameSessionStore.proxy);
	const [buttonCooldown, setButtonCooldown] = React.useState(true);

	// Button cooldown to prevent accidentally spamming start/stop
	React.useEffect(() => {
		setButtonCooldown(true);
		const timeout = setTimeout(() => {
			setButtonCooldown(false);
		}, 1000);

		return () => clearTimeout(timeout);
	}, [started]);

	const playerLink = generateLink(clientContext.playerCode, {
		mode: 'player'
	});

	const presenterLink = generateLink(clientContext.presenterCode, {
		mode: 'presenter',
		playerCode: clientContext.playerCode
	});

	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header />
			<HostPresenterLayout.Main>
				<div className="space-y-4">
					<GameStateView />

					<HostControls />
				</div>
			</HostPresenterLayout.Main>

			<HostPresenterLayout.Footer>
				<div className="inline-flex flex-wrap gap-4">
					{!started && (
						<button
							type="button"
							className="km-btn-primary"
							onClick={gameSessionActions.startGame}
							disabled={buttonCooldown}
						>
							<CirclePlay className="size-5" />
							{config.startButton}
						</button>
					)}
					{started && (
						<button
							type="button"
							className="km-btn-error"
							onClick={gameSessionActions.stopGame}
							disabled={buttonCooldown}
						>
							<CircleStop className="size-5" />
							{config.stopButton}
						</button>
					)}

					<a
						href={playerLink}
						target="_blank"
						rel="noreferrer"
						className="km-btn-secondary"
					>
						{config.playerLinkLabel}
						<SquareArrowOutUpRight className="size-5" />
					</a>

					<a
						href={presenterLink}
						target="_blank"
						rel="noreferrer"
						className="km-btn-secondary"
					>
						{config.presenterLinkLabel}
						<SquareArrowOutUpRight className="size-5" />
					</a>
				</div>
			</HostPresenterLayout.Footer>
		</HostPresenterLayout.Root>
	);
}

export default withModeGuard(App, 'host');
