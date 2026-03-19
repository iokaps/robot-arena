import { ArenaGrid } from '@/components/arena-grid';
import { MatchResultBreakdown } from '@/components/match-result-breakdown';
import { withKmProviders } from '@/components/with-km-providers';
import {
	withModeGuard,
	type ModeGuardProps
} from '@/components/with-mode-guard';
import { config } from '@/config';
import { MAX_ARENA_PLAYERS } from '@/config/arena-maps';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { usePlayersWithOnlineStatus } from '@/hooks/usePlayersWithOnlineStatus';
import { useServerTimer } from '@/hooks/useServerTime';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import {
	MAP_LAYOUTS,
	sanitizeMapLayoutId,
	willArenaShrinkNextRound
} from '@/state/actions/arena-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { gameConfigStore } from '@/state/stores/game-config-store';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import type { Position, Rotation } from '@/types/arena';
import { cn } from '@/utils/cn';
import { getActiveShotsForTick } from '@/utils/getActiveShots';
import { getMatchResultCopy } from '@/utils/getMatchResultCopy';
import {
	getMatchResultStandings,
	isTimeoutResult
} from '@/utils/getMatchResultStandings';
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
		resultReason,
		damageDealtByPlayer,
		submittedPlayers,
		executionEvents
	} = useSnapshot(matchStore.proxy);
	const { robots, mapLayoutId, gridSize } = useSnapshot(arenaStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);
	const { activePlayers, onlinePlayersCount } = usePlayersWithOnlineStatus();
	const playerCount = onlinePlayersCount;
	const selectedMapLayoutId = sanitizeMapLayoutId(mapLayoutId);

	const serverTime = useServerTimer(100);

	const playerLink = generateLink(clientContext.playerCode, {
		mode: 'player'
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

		const shots = getActiveShotsForTick(executionEvents, currentTick);
		setActiveShots(shots);
		const timeout = setTimeout(() => setActiveShots([]), 500);
		return () => clearTimeout(timeout);
	}, [currentTick, executionEvents, phase]);

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
	const allAliveSubmitted =
		phase === 'programming' &&
		aliveRobotCount > 0 &&
		submittedCount >= aliveRobotCount;
	const showShrinkWarning = willArenaShrinkNextRound(currentRound, gridSize);
	const winnerName = winnerId ? players[winnerId]?.name || 'Unknown' : null;
	const resultCopy = getMatchResultCopy(resultReason);
	const showTimeoutBreakdown = isTimeoutResult(resultReason);
	const standings = React.useMemo(
		() =>
			showTimeoutBreakdown
				? getMatchResultStandings(robots, damageDealtByPlayer)
				: [],
		[damageDealtByPlayer, robots, showTimeoutBreakdown]
	);

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
								{playerCount}/{MAX_ARENA_PLAYERS}
							</span>
							<span className="font-mono text-slate-500 uppercase">
								{config.playersJoinedLabel}
							</span>
						</div>

						{/* Animated player roster */}
						{playerCount > 0 && (
							<div className="flex flex-wrap justify-center gap-3">
								{activePlayers.map((player, index) => (
									<div
										key={player.id}
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

						<div className="w-full max-w-2xl space-y-3 rounded-sm border-2 border-slate-700 bg-slate-800/40 px-6 py-5 backdrop-blur-sm">
							<div className="flex items-center justify-between gap-3">
								<h2 className="font-display text-neon-cyan text-2xl tracking-wide uppercase">
									{config.mapSelectLabel}
								</h2>
								<span className="font-mono text-sm text-slate-400 uppercase">
									{config.mapSelectLabel}:{' '}
									{MAP_LAYOUTS[selectedMapLayoutId].name}
								</span>
							</div>

							<div className="border-neon-lime/60 bg-neon-lime/10 rounded-sm border-2 px-3 py-2">
								<div className="font-display text-sm tracking-wide text-slate-100 uppercase">
									{MAP_LAYOUTS[selectedMapLayoutId].name}
								</div>
							</div>
						</div>

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

					{phase === 'results' && (
						<div
							className={cn(
								'font-display flex items-center gap-2 rounded-sm border-2 px-4 py-2 uppercase',
								winnerId
									? 'border-neon-lime/50 bg-neon-lime/10 text-neon-lime shadow-[0_0_12px_var(--color-neon-lime)/0.12]'
									: 'border-slate-500/60 bg-slate-800/60 text-slate-200'
							)}
						>
							{config.phaseResults}
						</div>
					)}

					{/* Submission status during programming */}
					{phase === 'programming' && (
						<div className="flex items-center gap-2 font-mono text-slate-400">
							{allAliveSubmitted ? (
								<span className="text-neon-lime">
									{config.allSubmittedStartingMessage}
								</span>
							) : (
								<span>
									{submittedCount}/{aliveRobotCount} {config.submittedLabel}
								</span>
							)}
						</div>
					)}
				</div>
			</HostPresenterLayout.Header>

			<HostPresenterLayout.Main className="relative justify-center">
				{phase !== 'results' && showShrinkWarning && (
					<div className="border-neon-rose/60 bg-neon-rose/10 absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-sm border-2 px-5 py-3 shadow-[0_0_16px_var(--color-neon-rose)/0.2]">
						<p className="font-display text-neon-rose text-sm tracking-wide uppercase">
							{config.hazardShrinkWarningTitle}
						</p>
						<p className="font-mono text-sm text-slate-200">
							{config.hazardShrinkWarningMessage}
						</p>
					</div>
				)}

				<ArenaGrid cellSize={56} showNames={true} activeShots={activeShots} />

				{phase === 'results' && (
					<div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-6 py-10 backdrop-blur-[2px]">
						<div className="animate-fade-in-up flex w-full max-w-3xl flex-col items-center gap-8 rounded-sm border-2 border-slate-700 bg-slate-950/88 px-8 py-8 text-center shadow-[0_0_40px_rgba(0,0,0,0.35)]">
							{showTimeoutBreakdown && (
								<p className="font-display text-sm tracking-[0.24em] text-slate-400 uppercase">
									{config.roundLimitReachedTitle}
								</p>
							)}

							{winnerId ? (
								<>
									<Trophy className="text-neon-lime animate-shine h-28 w-28" />
									<h1 className="font-display text-neon-lime neon-text-glow text-5xl tracking-wider uppercase">
										{config.winnerTitle}
									</h1>
									<p className="font-display neon-text-glow-sm text-neon-lime text-4xl tracking-wide uppercase">
										{winnerName}
									</p>
									{resultCopy && (
										<p className="max-w-2xl font-mono text-lg text-slate-300">
											{resultCopy}
										</p>
									)}
								</>
							) : (
								<>
									<h1 className="font-display text-5xl tracking-wider text-slate-200 uppercase">
										{config.drawTitle}
									</h1>
									<p className="max-w-2xl font-mono text-xl text-slate-400">
										{resultCopy ?? config.drawMessage}
									</p>
								</>
							)}

							{showTimeoutBreakdown && standings.length > 0 && (
								<MatchResultBreakdown
									standings={standings}
									winnerId={winnerId}
									className="w-full max-w-xl"
								/>
							)}
						</div>
					</div>
				)}

				{phase !== 'results' && (
					<div className="absolute right-6 bottom-6">
						<KmQrCode
							data={playerLink}
							size={140}
							className={cn('transition-opacity', {
								invisible: !showPresenterQr
							})}
						/>
					</div>
				)}
			</HostPresenterLayout.Main>
		</HostPresenterLayout.Root>
	);
}

export default withKmProviders(withModeGuard(App, 'presenter'));
