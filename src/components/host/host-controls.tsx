import { MinimapPreview } from '@/components/minimap-preview';
import { config } from '@/config';
import { ARENA_MAPS } from '@/config/arena-maps';
import { MAP_LAYOUTS, arenaActions } from '@/state/actions/arena-actions';
import { gameConfigActions } from '@/state/actions/game-config-actions';
import { matchActions } from '@/state/actions/match-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { gameConfigStore } from '@/state/stores/game-config-store';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import type { ArenaSizeId, MapLayoutId } from '@/types/arena';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import {
	ChevronDown,
	ChevronUp,
	Heart,
	HelpCircle,
	Map,
	Maximize2,
	Play,
	RotateCcw,
	Skull,
	Users
} from 'lucide-react';
import * as React from 'react';

/** Labels for arena sizes */
const ARENA_SIZE_LABELS: Record<ArenaSizeId, string> = {
	auto: config.mapAutoSelectLabel,
	small: config.mapSmallLabel,
	medium: config.mapMediumLabel,
	large: config.mapLargeLabel,
	mega: config.mapMegaLabel
};

/**
 * Host controls for Code-A-Bot Arena.
 * Map selection, match controls, player status.
 */
export function HostControls() {
	const [showHowToPlay, setShowHowToPlay] = React.useState(false);
	const { phase, currentRound } = useSnapshot(matchStore.proxy);
	const { mapLayoutId, robots, selectedSizeId, gridSize } = useSnapshot(
		arenaStore.proxy
	);
	const { showPresenterQr } = useSnapshot(gameConfigStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);

	const playerCount = Object.keys(players).length;
	const isInMatch = phase !== 'lobby' && phase !== 'results';

	const handleMapLayoutChange = async (layoutId: MapLayoutId) => {
		await arenaActions.setMapLayout(layoutId);
	};

	const handleArenaSizeChange = async (sizeId: ArenaSizeId) => {
		await arenaActions.setArenaSize(sizeId);
	};

	const handleStartMatch = async () => {
		if (playerCount < 2) return;
		await matchActions.startMatch();
	};

	const handleResetMatch = async () => {
		await matchActions.resetMatch();
	};

	// Get recommended map size for current player count
	const getRecommendedSize = (): string => {
		const map = ARENA_MAPS.find(
			(m) => playerCount >= m.minPlayers && playerCount <= m.maxPlayers
		);
		return map ? `${map.gridSize.width}×${map.gridSize.height}` : '22×22';
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
				<div className="space-y-4">
					{/* How to Play - Collapsible */}
					<div className="rounded-xl border border-slate-600 bg-slate-800/50">
						<button
							type="button"
							onClick={() => setShowHowToPlay(!showHowToPlay)}
							className="flex w-full items-center justify-between px-4 py-3 text-left"
						>
							<span className="flex items-center gap-2 text-sm font-medium text-slate-200">
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
							<div className="space-y-4 border-t border-slate-700 px-4 py-3 text-sm">
								{/* Setup Steps */}
								<div>
									<h4 className="mb-2 font-medium text-slate-200">
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
									<h4 className="mb-2 font-medium text-slate-200">
										{config.hostTerrainTitle}
									</h4>
									<div className="space-y-1 text-slate-400">
										<div className="flex items-center gap-2">
											<div className="bg-arena-obstacle h-4 w-4 rounded-sm border border-slate-600" />
											<span>{config.hostTerrainWall}</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex h-4 w-4 items-center justify-center rounded-sm bg-gradient-to-br from-red-950 to-red-900">
												<Skull className="h-3 w-3 text-red-500/80" />
											</div>
											<span>{config.hostTerrainPit}</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex h-4 w-4 items-center justify-center rounded-sm bg-amber-900/50">
												<ChevronUp className="h-3 w-3 text-amber-400/70" />
											</div>
											<span>{config.hostTerrainConveyor}</span>
										</div>
									</div>
								</div>

								{/* Quick Rules */}
								<div>
									<h4 className="mb-2 font-medium text-slate-200">
										{config.hostRulesTitle}
									</h4>
									<ul className="list-inside list-disc space-y-1 text-slate-400">
										<li>{config.hostRule1}</li>
										<li>{config.hostRule2}</li>
										<li>{config.hostRule3}</li>
									</ul>
								</div>
							</div>
						)}
					</div>

					{/* Arena Size Selection */}
					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm text-slate-400">
							<Maximize2 className="h-4 w-4" />
							{config.arenaSizeLabel}:
							{selectedSizeId === 'auto' && (
								<span className="text-neon-cyan text-xs">
									({getRecommendedSize()} {config.forPlayersLabel} {playerCount}
									)
								</span>
							)}
						</label>
						<div className="flex flex-wrap gap-2">
							{(
								['auto', 'small', 'medium', 'large', 'mega'] as ArenaSizeId[]
							).map((sizeId) => (
								<button
									key={sizeId}
									type="button"
									onClick={() => handleArenaSizeChange(sizeId)}
									className={cn(
										'rounded-lg border px-3 py-2 text-sm transition-all',
										selectedSizeId === sizeId
											? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan'
											: 'hover:border-neon-cyan/50 border-slate-600 bg-slate-800 text-slate-300'
									)}
								>
									{ARENA_SIZE_LABELS[sizeId]}
								</button>
							))}
						</div>
					</div>

					{/* Obstacle Layout Selection */}
					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm text-slate-400">
							<Map className="h-4 w-4" />
							{config.mapSelectLabel}:
						</label>
						<div className="flex flex-wrap gap-2">
							{Object.values(MAP_LAYOUTS).map((layout) => (
								<button
									key={layout.id}
									type="button"
									onClick={() => handleMapLayoutChange(layout.id)}
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

						{/* Minimap Preview */}
						<div className="mt-3 flex items-center gap-3">
							<MinimapPreview
								layoutId={mapLayoutId}
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

			{/* Current arena size indicator (during match) */}
			{isInMatch && (
				<div className="flex items-center gap-2 text-sm text-slate-400">
					<Maximize2 className="h-4 w-4" />
					<span>
						{config.arenaSizeLabel}: {gridSize.width}×{gridSize.height}
					</span>
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
