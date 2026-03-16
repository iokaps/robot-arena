import { MinimapPreview } from '@/components/minimap-preview';
import { config } from '@/config';
import { MAX_ARENA_PLAYERS, MIN_ARENA_PLAYERS } from '@/config/arena-maps';
import { usePlayersWithOnlineStatus } from '@/hooks/usePlayersWithOnlineStatus';
import {
	MAP_LAYOUTS,
	sanitizeMapLayoutId
} from '@/state/actions/arena-actions';
import { gameConfigActions } from '@/state/actions/game-config-actions';
import { matchActions } from '@/state/actions/match-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { gameConfigStore } from '@/state/stores/game-config-store';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import {
	ChevronDown,
	ChevronUp,
	Heart,
	HelpCircle,
	Map,
	Play,
	RefreshCw,
	RotateCcw,
	Shield,
	Skull,
	Users,
	Zap
} from 'lucide-react';
import * as React from 'react';

/**
 * Host controls for Code-A-Bot Arena.
 * Map selection, match controls, player status.
 */
export function HostControls() {
	const [showHowToPlay, setShowHowToPlay] = React.useState(false);
	const { phase, currentRound } = useSnapshot(matchStore.proxy);
	const { mapLayoutId, robots, gridSize } = useSnapshot(arenaStore.proxy);
	const { showPresenterQr } = useSnapshot(gameConfigStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);
	const { onlinePlayersCount } = usePlayersWithOnlineStatus();
	const selectedMapLayoutId = sanitizeMapLayoutId(mapLayoutId);

	const playerCount =
		phase === 'lobby' ? onlinePlayersCount : Object.keys(players).length;
	const isInMatch = phase !== 'lobby' && phase !== 'results';
	const canStartMatch =
		onlinePlayersCount >= MIN_ARENA_PLAYERS &&
		onlinePlayersCount <= MAX_ARENA_PLAYERS;

	const handleStartMatch = async () => {
		if (!canStartMatch) return;
		await matchActions.startMatch();
	};

	const handleStartRematch = async () => {
		await matchActions.startRematch();
	};

	const handleResetMatch = async () => {
		await matchActions.resetMatch();
	};

	return (
		<div className="space-y-6">
			{/* Phase indicator */}
			<div className="flex items-center gap-4">
				<span className="font-mono text-sm text-slate-400 uppercase">
					{config.phaseLabel}:
				</span>
				<div
					className={cn(
						'font-display rounded-sm border-2 px-4 py-2 text-sm tracking-wider uppercase',
						phase === 'lobby' &&
							'border-slate-700 bg-slate-800/60 text-slate-400',
						phase === 'programming' &&
							'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_var(--color-neon-cyan)/0.15]',
						phase === 'executing' &&
							'border-neon-fuchsia/50 bg-neon-fuchsia/10 text-neon-fuchsia shadow-[0_0_10px_var(--color-neon-fuchsia)/0.15]',
						phase === 'results' &&
							'border-neon-lime/50 bg-neon-lime/10 text-neon-lime shadow-[0_0_10px_var(--color-neon-lime)/0.15]'
					)}
				>
					{phase === 'lobby' && config.phaseLobby}
					{phase === 'programming' &&
						`${config.phaseProgramming} - ${config.roundLabel} ${currentRound}`}
					{phase === 'executing' &&
						`${config.phaseExecuting} - ${config.roundLabel} ${currentRound}`}
					{phase === 'results' && config.phaseResults}
				</div>
			</div>

			{/* Map selection (only in lobby) */}
			{phase === 'lobby' && (
				<div className="space-y-4">
					{/* How to Play - Collapsible */}
					<div className="rounded-sm border-2 border-slate-700 bg-slate-800/40 backdrop-blur-sm">
						<button
							type="button"
							onClick={() => setShowHowToPlay(!showHowToPlay)}
							className="flex w-full items-center justify-between px-4 py-3 text-left"
						>
							<span className="flex items-center gap-2 font-mono text-sm font-medium text-slate-200 uppercase">
								<HelpCircle className="text-neon-cyan h-4 w-4" />
								{config.hostHowToPlayTitle}
							</span>
							{showHowToPlay ? (
								<ChevronUp className="h-4 w-4 text-slate-400" />
							) : (
								<ChevronDown className="h-4 w-4 text-slate-400" />
							)}
						</button>

						{showHowToPlay && (
							<div className="space-y-4 border-t border-slate-700 px-4 py-3 font-mono text-sm">
								{/* Setup Steps */}
								<div>
									<h4 className="mb-2 font-medium text-slate-200 uppercase">
										{config.hostSetupTitle}
									</h4>
									<ol className="list-inside list-decimal space-y-1 text-slate-400">
										<li>{config.hostSetupStep1}</li>
										<li>{config.hostSetupStep2}</li>
										<li>{config.hostSetupStep3}</li>
										<li>{config.hostSetupStep4}</li>
									</ol>
								</div>

								{/* Terrain Legend */}
								<div>
									<h4 className="mb-2 font-medium text-slate-200 uppercase">
										{config.hostTerrainTitle}
									</h4>
									<div className="space-y-1 text-slate-400">
										<div className="flex items-center gap-2">
											<div className="bg-arena-obstacle h-4 w-4 border-2 border-slate-500" />
											<span>{config.hostTerrainWall}</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="border-neon-rose/50 flex h-4 w-4 items-center justify-center border-2 bg-slate-950">
												<Skull className="text-neon-rose/70 h-3 w-3" />
											</div>
											<span>{config.hostTerrainPit}</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="border-neon-amber/40 flex h-4 w-4 items-center justify-center border-2 bg-slate-900/80">
												<ChevronUp className="text-neon-amber/80 h-3 w-3" />
											</div>
											<span>{config.hostTerrainConveyor}</span>
										</div>
									</div>
								</div>

								<div>
									<h4 className="mb-2 font-medium text-slate-200 uppercase">
										{config.hostPickupTitle}
									</h4>
									<div className="space-y-1 text-slate-400">
										<div className="flex items-center gap-2">
											<Heart
												className="text-neon-rose h-4 w-4"
												fill="currentColor"
											/>
											<span>{config.hostPickupHealthPack}</span>
										</div>
										<div className="flex items-center gap-2">
											<Shield className="text-neon-cyan h-4 w-4" />
											<span>{config.hostPickupShield}</span>
										</div>
										<div className="flex items-center gap-2">
											<Zap
												className="text-neon-orange h-4 w-4"
												fill="currentColor"
											/>
											<span>{config.hostPickupPowerCell}</span>
										</div>
									</div>
								</div>

								{/* Quick Rules */}
								<div>
									<h4 className="mb-2 font-medium text-slate-200 uppercase">
										{config.hostRulesTitle}
									</h4>
									<ul className="list-inside list-disc space-y-1 text-slate-400">
										<li>{config.hostRule1}</li>
										<li>{config.hostRule2}</li>
										<li>{config.hostRule3}</li>
										<li>{config.hostRule4}</li>
									</ul>
								</div>
							</div>
						)}
					</div>

					{/* Obstacle Layout Selection */}
					<div className="space-y-2">
						<label className="flex items-center gap-2 font-mono text-sm text-slate-400 uppercase">
							<Map className="h-4 w-4" />
							{config.mapSelectLabel}:
						</label>
						<div className="border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan inline-flex rounded-sm border-2 px-4 py-2 font-mono text-sm uppercase shadow-[0_0_8px_var(--color-neon-cyan)/0.08]">
							{MAP_LAYOUTS[selectedMapLayoutId].name}
						</div>

						{/* Minimap Preview */}
						<div className="mt-3 flex items-center gap-3">
							<MinimapPreview
								layoutId={selectedMapLayoutId}
								gridSize={gridSize}
								cellSize={10}
								maxWidth={200}
							/>
							<span className="text-xs text-slate-500">
								{gridSize.width}×{gridSize.height}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Player count */}
			<div className="flex items-center gap-4 rounded-sm border-2 border-slate-700 bg-slate-800/40 px-4 py-3 backdrop-blur-sm">
				<Users className="text-neon-cyan h-5 w-5 drop-shadow-[0_0_6px_currentColor]" />
				<span className="font-mono text-slate-300">
					{playerCount}/{MAX_ARENA_PLAYERS} {config.playersJoinedLabel}
				</span>
				{playerCount < MIN_ARENA_PLAYERS && phase === 'lobby' && (
					<span className="text-neon-rose font-mono text-sm">
						({config.minPlayersMessage})
					</span>
				)}
				{playerCount > MAX_ARENA_PLAYERS && phase === 'lobby' && (
					<span className="text-neon-rose font-mono text-sm">
						({config.maxPlayersMessage})
					</span>
				)}
			</div>

			{phase === 'lobby' && (
				<p className="font-mono text-xs text-slate-500">
					{config.hostReconnectHintMessage}
				</p>
			)}

			{/* Robot status (during match) */}
			{isInMatch && Object.keys(robots).length > 0 && (
				<div className="space-y-2">
					<span className="font-mono text-sm text-slate-400 uppercase">
						{config.robotStatusLabel}:
					</span>
					<div className="flex flex-wrap gap-2">
						{Object.entries(robots).map(([clientId, robot]) => (
							<div
								key={clientId}
								className="flex items-center gap-2 rounded-sm border-2 border-slate-700 bg-slate-800/60 px-3 py-2"
							>
								<span
									className={cn(
										'h-3 w-3 rounded-full',
										robot.color === 'cyan' && 'bg-neon-cyan',
										robot.color === 'fuchsia' && 'bg-neon-fuchsia',
										robot.color === 'lime' && 'bg-neon-lime',
										robot.color === 'orange' && 'bg-neon-orange',
										robot.color === 'rose' && 'bg-neon-rose',
										robot.color === 'violet' && 'bg-neon-violet'
									)}
								/>
								<span className="font-mono text-sm text-slate-300">
									{robot.name}
								</span>
								<div className="flex gap-0.5">
									{Array.from({ length: 3 }).map((_, i) => (
										<Heart
											key={i}
											className={cn(
												'h-3 w-3',
												i < robot.lives ? 'text-neon-rose' : 'text-slate-700'
											)}
											fill={i < robot.lives ? 'currentColor' : 'none'}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* QR toggle */}
			<button
				type="button"
				className={showPresenterQr ? 'km-btn-neutral' : 'km-btn-secondary'}
				onClick={gameConfigActions.togglePresenterQr}
			>
				{config.togglePresenterQrButton}
			</button>

			{/* Match controls */}
			<div className="flex gap-3">
				{phase === 'lobby' && (
					<button
						type="button"
						className="km-btn-primary"
						onClick={handleStartMatch}
						disabled={!canStartMatch}
					>
						<Play className="h-5 w-5" />
						{config.startMatchButton}
					</button>
				)}

				{phase === 'results' && (
					<button
						type="button"
						className="km-btn-primary"
						onClick={handleStartRematch}
					>
						<RefreshCw className="h-5 w-5" />
						{config.rematchButton}
					</button>
				)}

				{(isInMatch || phase === 'results') && (
					<button
						type="button"
						className="km-btn-error"
						onClick={handleResetMatch}
					>
						<RotateCcw className="h-5 w-5" />
						{config.resetMatchButton}
					</button>
				)}
			</div>
		</div>
	);
}
