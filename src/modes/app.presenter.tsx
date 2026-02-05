import { ArenaGrid } from '@/components/arena-grid';
import {
	withModeGuard,
	type ModeGuardProps
} from '@/components/with-mode-guard';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { useServerTimer } from '@/hooks/useServerTime';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { arenaStore } from '@/state/stores/arena-store';
import { gameConfigStore } from '@/state/stores/game-config-store';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import { robotProgramsStore } from '@/state/stores/robot-programs-store';
import type { Position, Rotation } from '@/types/arena';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { KmQrCode, KmTimeCountdown } from '@kokimoki/shared';
import { Clock, Trophy, Users } from 'lucide-react';
import * as React from 'react';

function App({ clientContext }: ModeGuardProps<'presenter'>) {
	useGlobalController();
	useDocumentTitle(config.title);

	const { showPresenterQr } = useSnapshot(gameConfigStore.proxy);
	const {
		phase,
		currentRound,
		currentTick,
		phaseStartTimestamp,
		programmingDuration,
		winnerId,
		submittedPlayers
	} = useSnapshot(matchStore.proxy);
	const { robots } = useSnapshot(arenaStore.proxy);
	const { programs } = useSnapshot(robotProgramsStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);

	const serverTime = useServerTimer(100);

	const playerLink = generateLink(clientContext.playerCode, {
		mode: 'player'
	});

	// Calculate active shots for visualization
	const [activeShots, setActiveShots] = React.useState<
		Array<{ from: Position; direction: Rotation; shooterId: string }>
	>([]);

	// Show laser beams when robots shoot
	React.useEffect(() => {
		if (phase !== 'executing' || currentTick < 0) {
			setActiveShots([]);
			return;
		}

		// Find robots that are shooting this tick
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

		// Clear shots after animation
		const timeout = setTimeout(() => setActiveShots([]), 500);
		return () => clearTimeout(timeout);
	}, [currentTick, phase, programs, robots]);

	// Calculate remaining time for programming phase
	const elapsedMs = serverTime - phaseStartTimestamp;
	const totalMs = programmingDuration * 1000;
	const remainingMs = Math.max(0, totalMs - elapsedMs);
	const isUrgent = remainingMs < 10000 && phase === 'programming';

	// Count only alive robots for submission status
	const aliveRobotCount = Object.values(robots).filter(
		(robot) => robot.lives > 0
	).length;
	const submittedCount = Object.keys(submittedPlayers).length;
	const winnerName = winnerId ? players[winnerId]?.name || 'Unknown' : null;

	// Lobby view
	if (phase === 'lobby') {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header />
				<HostPresenterLayout.Main>
					<div className="flex flex-col items-center gap-8">
						<h1 className="font-display text-neon-cyan neon-text-glow text-4xl tracking-widest uppercase">
							{config.title}
						</h1>
						<p className="font-mono text-xl text-slate-300">
							{config.presenterLobbyMessage}
						</p>

						<div className="flex items-center gap-4 border-2 border-slate-600 bg-slate-800/50 px-6 py-4">
							<Users className="text-neon-cyan h-8 w-8" />
							<span className="font-display text-3xl text-slate-100">
								{Object.keys(players).length}
							</span>
							<span className="font-mono text-slate-400 uppercase">
								{config.playersJoinedLabel}
							</span>
						</div>

						<KmQrCode
							data={playerLink}
							size={250}
							className={cn({ invisible: !showPresenterQr })}
						/>

						<p className="font-mono text-slate-500">
							{config.scanToJoinMessage}
						</p>
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		);
	}

	// Results view
	if (phase === 'results') {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header />
				<HostPresenterLayout.Main>
					<div className="flex flex-col items-center gap-8">
						{winnerId ? (
							<>
								<Trophy className="text-neon-lime h-32 w-32" />
								<h1 className="font-display text-neon-lime neon-text-glow text-5xl tracking-wider uppercase">
									{config.winnerTitle}
								</h1>
								<p className="font-display text-4xl tracking-wide text-slate-100 uppercase">
									{winnerName}
								</p>
							</>
						) : (
							<>
								<h1 className="font-display text-5xl tracking-wider text-slate-400 uppercase">
									{config.drawTitle}
								</h1>
								<p className="font-mono text-2xl text-slate-500">
									{config.drawMessage}
								</p>
							</>
						)}
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		);
	}

	// Programming / Executing view
	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header>
				<div className="flex items-center gap-6">
					{/* Round indicator */}
					<div className="flex items-center gap-2 font-mono text-slate-300">
						<span className="font-display text-lg tracking-wide uppercase">
							{config.roundLabel} {currentRound}
						</span>
					</div>

					{/* Phase indicator */}
					{phase === 'programming' && (
						<div
							className={cn(
								'font-display flex items-center gap-2 border-2 px-4 py-2',
								isUrgent
									? 'animate-neon-pulse border-neon-rose/60 bg-neon-rose/10 text-neon-rose'
									: 'border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan'
							)}
						>
							<Clock className="h-5 w-5" />
							<KmTimeCountdown ms={remainingMs} />
						</div>
					)}

					{phase === 'executing' && (
						<div className="border-neon-fuchsia/60 bg-neon-fuchsia/10 text-neon-fuchsia flex items-center gap-2 border-2 px-4 py-2">
							<span className="font-display text-lg tracking-wide uppercase">
								{config.tickLabel} {currentTick + 1}/5
							</span>
						</div>
					)}

					{/* Submission status during programming */}
					{phase === 'programming' && (
						<div className="flex items-center gap-2 font-mono text-slate-400">
							<span>
								{submittedCount}/{aliveRobotCount} {config.submittedLabel}
							</span>
						</div>
					)}
				</div>
			</HostPresenterLayout.Header>

			<HostPresenterLayout.Main className="justify-center">
				<ArenaGrid cellSize={56} showNames={true} activeShots={activeShots} />
			</HostPresenterLayout.Main>
		</HostPresenterLayout.Root>
	);
}

export default withModeGuard(App, 'presenter');
