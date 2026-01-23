import { ArenaGrid } from '@/components/arena-grid';
import { HostControls } from '@/components/host/host-controls';
import {
	type ModeGuardProps,
	withModeGuard
} from '@/components/with-mode-guard';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { usePlayersWithOnlineStatus } from '@/hooks/usePlayersWithOnlineStatus';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { arenaStore } from '@/state/stores/arena-store';
import { matchStore } from '@/state/stores/match-store';
import { robotProgramsStore } from '@/state/stores/robot-programs-store';
import type { Position, Rotation } from '@/types/arena';
import { useSnapshot } from '@kokimoki/app';
import { SquareArrowOutUpRight, Users } from 'lucide-react';
import * as React from 'react';

function App({ clientContext }: ModeGuardProps<'host'>) {
	useDocumentTitle(config.title);
	useGlobalController();

	const { phase, currentTick } = useSnapshot(matchStore.proxy);
	const { robots } = useSnapshot(arenaStore.proxy);
	const { programs } = useSnapshot(robotProgramsStore.proxy);
	const { onlinePlayersCount } = usePlayersWithOnlineStatus();

	const playerLink = generateLink(clientContext.playerCode, {
		mode: 'player'
	});

	const presenterLink = generateLink(clientContext.presenterCode, {
		mode: 'presenter',
		playerCode: clientContext.playerCode
	});

	// Calculate active shots for visualization
	const [activeShots, setActiveShots] = React.useState<
		Array<{ from: Position; direction: Rotation; shooterId: string }>
	>([]);

	React.useEffect(() => {
		if (phase !== 'executing' || currentTick < 0) {
			setActiveShots([]);
			return;
		}

		const shots: Array<{
			from: Position;
			direction: Rotation;
			shooterId: string;
		}> = [];
		Object.entries(programs).forEach(([clientId, program]) => {
			const command = program[currentTick];
			const robot = robots[clientId];
			if (command === 'shoot' && robot) {
				shots.push({
					from: robot.position,
					direction: robot.rotation,
					shooterId: clientId
				});
			}
		});

		setActiveShots(shots);
		const timeout = setTimeout(() => setActiveShots([]), 500);
		return () => clearTimeout(timeout);
	}, [currentTick, phase, programs, robots]);

	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header>
				<div className="flex items-center gap-3 text-slate-400">
					<Users className="h-5 w-5" />
					<span>
						{onlinePlayersCount} {config.online.toLowerCase()}
					</span>
				</div>
			</HostPresenterLayout.Header>
			<HostPresenterLayout.Main className="flex-col gap-6">
				{/* Show arena when not in lobby */}
				{phase !== 'lobby' && (
					<div className="flex justify-center">
						<ArenaGrid
							cellSize={40}
							showNames={true}
							activeShots={activeShots}
						/>
					</div>
				)}

				<HostControls />
			</HostPresenterLayout.Main>

			<HostPresenterLayout.Footer>
				<div className="inline-flex flex-wrap gap-4">
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
