import { ArenaGrid } from '@/components/arena-grid';
import { withKmProviders } from '@/components/with-km-providers';
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
import {
	KmQrCode,
	KmTimeCountdown,
	useKmConfettiContext
} from '@kokimoki/shared';
import { Clock, Trophy, Users } from 'lucide-react';
import * as React from 'react';

function App({ clientContext }: ModeGuardProps<'presenter'>) {
	useGlobalController();
	useDocumentTitle(config.title);

	const { triggerConfetti, stopConfetti } = useKmConfettiContext();

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

	// Trigger confetti on results phase with a winner
	React.useEffect(() => {
		if (phase === 'results' && winnerId) {
			triggerConfetti({ preset: 'massive' });
		}
		return () => {
			stopConfetti();
		};
	}, [phase, winnerId, triggerConfetti, stopConfetti]);

	// Lobby view
	if (phase === 'lobby') {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header />
				<HostPresenterLayout.Main>
					<div className="animate-fade-in-up flex flex-col items-center gap-10">
						<h1 className="font-display text-neon-cyan neon-text-glow text-5xl tracking-[0.25em] uppercase">
							{config.title}
						</h1>
						<p className="font-mono text-xl text-slate-400">
							{config.presenterLobbyMessage}
						</p>

						<div className="flex items-center gap-5 rounded-sm border-2 border-slate-700 bg-slate-800/40 px-8 py-5 backdrop-blur-sm">
							<Users className="text-neon-cyan h-8 w-8 drop-shadow-[0_0_8px_currentColor]" />
							<span className="font-display text-neon-cyan neon-text-glow-sm text-4xl">
								{Object.keys(players).length}
							</span>
							<span className="font-mono text-slate-500 uppercase">
								{config.playersJoinedLabel}
							</span>
						</div>

						{/* Animated player roster */}
						{Object.keys(players).length > 0 && (
							<div className="flex flex-wrap justify-center gap-3">
								{Object.values(players).map((player, index) => (
									<div
										key={player.name}
										className="animate-fade-in-up border-neon-cyan/30 bg-neon-cyan/5 rounded-sm border-2 px-5 py-2.5 backdrop-blur-sm"
										style={{
											animationDelay: `${index * 80}ms`,
											animationFillMode: 'backwards'
										}}
									>
										<span className="font-display text-neon-cyan neon-text-glow-sm text-lg tracking-wider uppercase">
											{player.name}
										</span>
									</div>
								))}
							</div>
						)}

						<KmQrCode
							data={playerLink}
							size={250}
							className={cn({ invisible: !showPresenterQr })}
						/>

						<p className="font-mono text-sm text-slate-600">
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
					<div className="animate-fade-in-up flex flex-col items-center gap-10">
						{winnerId ? (
							<>
								<Trophy className="text-neon-lime animate-shine h-36 w-36" />
								<h1 className="font-display text-neon-lime neon-text-glow text-6xl tracking-wider uppercase">
									{config.winnerTitle}
								</h1>
								<p className="font-display neon-text-glow-sm text-neon-lime text-5xl tracking-wide uppercase">
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
					<div className="flex items-center gap-2 font-mono text-slate-400">
						<span className="font-display text-lg tracking-wider uppercase">
							{config.roundLabel} {currentRound}
						</span>
					</div>

					{/* Phase indicator */}
					{phase === 'programming' && (
						<div
							className={cn(
								'font-display flex items-center gap-2 rounded-sm border-2 px-4 py-2',
								isUrgent
									? 'animate-neon-pulse border-neon-rose/60 bg-neon-rose/10 text-neon-rose shadow-[0_0_15px_var(--color-neon-rose)/0.2]'
									: 'border-neon-cyan/50 bg-neon-cyan/5 text-neon-cyan'
							)}
						>
							<Clock className="h-5 w-5" />
							<KmTimeCountdown ms={remainingMs} />
						</div>
					)}

					{phase === 'executing' && (
						<div className="border-neon-fuchsia/50 bg-neon-fuchsia/10 text-neon-fuchsia flex items-center gap-2 rounded-sm border-2 px-4 py-2 shadow-[0_0_10px_var(--color-neon-fuchsia)/0.1]">
							<span className="font-display text-lg tracking-wider uppercase">
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

export default withKmProviders(withModeGuard(App, 'presenter'));
