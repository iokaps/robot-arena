import { PlayerMenu } from '@/components/menu';
import { NameLabel } from '@/components/name-label';
import { withKmProviders } from '@/components/with-km-providers';
import { withModeGuard } from '@/components/with-mode-guard';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { PlayerLayout } from '@/layouts/player';
import { kmClient } from '@/services/km-client';
import { localPlayerActions } from '@/state/actions/local-player-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { localPlayerStore } from '@/state/stores/local-player-store';
import { matchStore } from '@/state/stores/match-store';
import { CreateProfileView } from '@/views/create-profile-view';
import { EliminatedView } from '@/views/eliminated-view';
import { GameLobbyView } from '@/views/game-lobby-view';
import { ProgrammingView } from '@/views/programming-view';
import { ResultsView } from '@/views/results-view';
import { SpectatingView } from '@/views/spectating-view';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';

const App: React.FC = () => {
	useDocumentTitle(config.title);
	useGlobalController();

	const { name, currentView } = useSnapshot(localPlayerStore.proxy);
	const { phase, eliminatedPlayers } = useSnapshot(matchStore.proxy);
	const { robots } = useSnapshot(arenaStore.proxy);

	const myRobotColor = robots[kmClient.id]?.color;
	const isArenaParticipant = Boolean(robots[kmClient.id]);

	const isEliminated = eliminatedPlayers[kmClient.id] === true;
	const showJoinNextRoundBanner =
		(phase === 'programming' || phase === 'executing') &&
		!isArenaParticipant &&
		!isEliminated;

	// React to phase changes and update local view
	React.useEffect(() => {
		if (phase === 'lobby') {
			localPlayerActions.setCurrentView('lobby');
			localPlayerActions.resetForNewRound();
		} else if (phase === 'programming') {
			if (isEliminated) {
				localPlayerActions.setCurrentView('eliminated');
			} else if (!isArenaParticipant) {
				localPlayerActions.setCurrentView('spectating');
			} else {
				localPlayerActions.setCurrentView('programming');
				localPlayerActions.resetForNewRound();
			}
		} else if (phase === 'executing') {
			if (isEliminated) {
				localPlayerActions.setCurrentView('eliminated');
			} else {
				localPlayerActions.setCurrentView('spectating');
			}
		} else if (phase === 'results') {
			localPlayerActions.setCurrentView('results');
		}
	}, [phase, isEliminated, isArenaParticipant]);

	// Check for elimination during execution
	React.useEffect(() => {
		if (phase === 'executing' && isEliminated && currentView !== 'eliminated') {
			localPlayerActions.setCurrentView('eliminated');
		}
	}, [phase, isEliminated, currentView]);

	if (!name) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header />
				<PlayerLayout.Main>
					<CreateProfileView />
				</PlayerLayout.Main>
			</PlayerLayout.Root>
		);
	}

	return (
		<PlayerLayout.Root>
			<PlayerLayout.Header>
				<PlayerMenu />
			</PlayerLayout.Header>

			<PlayerLayout.Main>
				{showJoinNextRoundBanner && (
					<div className="border-neon-cyan/50 bg-neon-cyan/10 mb-4 rounded-sm border-2 px-4 py-3">
						<p className="font-display text-neon-cyan text-sm tracking-wide uppercase">
							{config.joinNextRoundBannerTitle}
						</p>
						<p className="font-mono text-sm text-slate-300">
							{config.joinNextRoundBannerMessage}
						</p>
					</div>
				)}

				{currentView === 'lobby' && <GameLobbyView />}
				{currentView === 'programming' && <ProgrammingView />}
				{currentView === 'spectating' && <SpectatingView />}
				{currentView === 'eliminated' && <EliminatedView />}
				{currentView === 'results' && <ResultsView />}
			</PlayerLayout.Main>

			<PlayerLayout.Footer>
				<NameLabel name={name} robotColor={myRobotColor} />
			</PlayerLayout.Footer>
		</PlayerLayout.Root>
	);
};

export default withKmProviders(withModeGuard(App, 'player'));
