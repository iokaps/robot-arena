import { config } from '@/config';
import { MAP_LAYOUTS, arenaActions } from '@/state/actions/arena-actions';
import { gameConfigActions } from '@/state/actions/game-config-actions';
import { matchActions } from '@/state/actions/match-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { gameConfigStore } from '@/state/stores/game-config-store';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import type { MapLayoutId } from '@/types/arena';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { Heart, Map, Play, RotateCcw, Users } from 'lucide-react';

/**
 * Host controls for Code-A-Bot Arena.
 * Map selection, match controls, player status.
 */
export function HostControls() {
	const { phase, currentRound } = useSnapshot(matchStore.proxy);
	const { mapLayoutId, robots } = useSnapshot(arenaStore.proxy);
	const { showPresenterQr } = useSnapshot(gameConfigStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);

	const playerCount = Object.keys(players).length;
	const isInMatch = phase !== 'lobby' && phase !== 'results';

	const handleMapChange = async (layoutId: MapLayoutId) => {
		await arenaActions.setMapLayout(layoutId);
	};

	const handleStartMatch = async () => {
		if (playerCount < 2) return;
		await matchActions.startMatch();
	};

	const handleResetMatch = async () => {
		await matchActions.resetMatch();
	};

	return (
		<div className="space-y-6">
			{/* Phase indicator */}
			<div className="flex items-center gap-4">
				<span className="text-sm text-slate-400">{config.phaseLabel}:</span>
				<div
					className={cn(
						'font-display rounded-lg border px-4 py-2 text-sm',
						phase === 'lobby' && 'border-slate-600 bg-slate-800 text-slate-300',
						phase === 'programming' &&
							'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan',
						phase === 'executing' &&
							'border-neon-fuchsia/50 bg-neon-fuchsia/10 text-neon-fuchsia',
						phase === 'results' &&
							'border-neon-lime/50 bg-neon-lime/10 text-neon-lime'
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
				<div className="space-y-2">
					<label className="flex items-center gap-2 text-sm text-slate-400">
						<Map className="h-4 w-4" />
						{config.mapSelectLabel}:
					</label>
					<div className="flex gap-2">
						{Object.values(MAP_LAYOUTS).map((layout) => (
							<button
								key={layout.id}
								type="button"
								onClick={() => handleMapChange(layout.id)}
								className={cn(
									'rounded-lg border px-4 py-2 text-sm transition-all',
									mapLayoutId === layout.id
										? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan'
										: 'hover:border-neon-cyan/50 border-slate-600 bg-slate-800 text-slate-300'
								)}
							>
								{layout.name}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Player count */}
			<div className="flex items-center gap-4 rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3">
				<Users className="text-neon-cyan h-5 w-5" />
				<span className="text-slate-300">
					{playerCount} {config.playersJoinedLabel}
				</span>
				{playerCount < 2 && phase === 'lobby' && (
					<span className="text-neon-rose text-sm">
						({config.minPlayersMessage})
					</span>
				)}
			</div>

			{/* Robot status (during match) */}
			{isInMatch && Object.keys(robots).length > 0 && (
				<div className="space-y-2">
					<span className="text-sm text-slate-400">
						{config.robotStatusLabel}:
					</span>
					<div className="flex flex-wrap gap-2">
						{Object.entries(robots).map(([clientId, robot]) => (
							<div
								key={clientId}
								className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
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
								<span className="text-sm text-slate-300">{robot.name}</span>
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
						disabled={playerCount < 2}
					>
						<Play className="h-5 w-5" />
						{config.startMatchButton}
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
