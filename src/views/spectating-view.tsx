import { ArenaGrid } from '@/components/arena-grid';
import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { willArenaShrinkNextRound } from '@/state/actions/arena-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { matchStore } from '@/state/stores/match-store';
import { robotProgramsStore } from '@/state/stores/robot-programs-store';
import type { MoveCommand, Position, Rotation } from '@/types/arena';
import { cn } from '@/utils/cn';
import { getActiveShotsForTick } from '@/utils/getActiveShots';
import { useSnapshot } from '@kokimoki/app';
import {
	ArrowUp,
	Clock,
	Crosshair,
	Heart,
	RotateCcw,
	RotateCw
} from 'lucide-react';
import * as React from 'react';

/** Command icon mapping */
const COMMAND_ICONS: Record<MoveCommand, React.ReactNode> = {
	'move-forward': <ArrowUp className="h-4 w-4" />,
	'rotate-left': <RotateCcw className="h-4 w-4" />,
	'rotate-right': <RotateCw className="h-4 w-4" />,
	shoot: <Crosshair className="h-4 w-4" />,
	wait: <Clock className="h-4 w-4" />
};

/**
 * Spectating view for players to watch the execution phase
 */
export const SpectatingView: React.FC = () => {
	const { robots, gridSize } = useSnapshot(arenaStore.proxy);
	const { currentTick, phase, currentRound, executionEvents } = useSnapshot(
		matchStore.proxy
	);
	const { programs } = useSnapshot(robotProgramsStore.proxy);
	const myRobot = robots[kmClient.id];
	const myProgram = programs[kmClient.id] || [];
	const showShrinkWarning = willArenaShrinkNextRound(currentRound, gridSize);
	const arenaContainerRef = React.useRef<HTMLDivElement | null>(null);
	const preferredArenaWidth = gridSize.width * 36;

	// Calculate active shots for visualization
	const [activeShots, setActiveShots] = React.useState<
		Array<{ from: Position; direction: Rotation; shooterId: string }>
	>([]);
	const [arenaMaxWidth, setArenaMaxWidth] = React.useState(preferredArenaWidth);

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

	React.useLayoutEffect(() => {
		const container = arenaContainerRef.current;
		if (!container) {
			return;
		}

		const updateArenaWidth = () => {
			const availableWidth = Math.max(1, Math.floor(container.clientWidth));
			setArenaMaxWidth(Math.min(preferredArenaWidth, availableWidth));
		};

		updateArenaWidth();

		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', updateArenaWidth);
			return () => window.removeEventListener('resize', updateArenaWidth);
		}

		const resizeObserver = new ResizeObserver(() => updateArenaWidth());
		resizeObserver.observe(container);

		return () => resizeObserver.disconnect();
	}, [preferredArenaWidth]);

	return (
		<div className="animate-fade-in-up flex w-full flex-col items-center gap-6">
			{/* Header with status */}
			<div className="flex w-full items-center justify-between">
				{/* My robot status */}
				{myRobot && (
					<div className="flex items-center gap-2 rounded-sm border border-slate-700 bg-slate-800/60 px-3 py-2">
						<span className="font-mono text-sm text-slate-500 uppercase">
							{config.livesLabel}
						</span>
						<div className="flex gap-1">
							{Array.from({ length: 3 }).map((_, i) => (
								<Heart
									key={i}
									className={cn(
										'h-5 w-5 transition-all duration-300',
										i < myRobot.lives
											? 'text-neon-rose drop-shadow-[0_0_4px_currentColor]'
											: 'text-slate-700'
									)}
									fill={i < myRobot.lives ? 'currentColor' : 'none'}
								/>
							))}
						</div>
					</div>
				)}

				{/* Execution tick indicator */}
				<div className="border-neon-fuchsia/50 bg-neon-fuchsia/10 text-neon-fuchsia flex items-center gap-2 rounded-sm border-2 px-4 py-2 shadow-[0_0_10px_var(--color-neon-fuchsia)/0.1]">
					<span className="font-display text-lg tracking-wide uppercase">
						{config.tickLabel} {currentTick + 1}/5
					</span>
				</div>
			</div>

			{showShrinkWarning && (
				<div className="border-neon-rose/60 bg-neon-rose/10 w-full rounded-sm border-2 px-4 py-3 shadow-[0_0_12px_var(--color-neon-rose)/0.15]">
					<p className="font-display text-neon-rose text-sm tracking-wide uppercase">
						{config.hazardShrinkWarningTitle}
					</p>
					<p className="font-mono text-sm text-slate-300">
						{config.hazardShrinkWarningMessage}
					</p>
				</div>
			)}

			{/* Arena */}
			<div ref={arenaContainerRef} className="flex w-full justify-center">
				<ArenaGrid
					highlightedRobotId={kmClient.id}
					cellSize={36}
					maxWidth={arenaMaxWidth}
					showNames={true}
					activeShots={activeShots}
				/>
			</div>

			{/* My program display */}
			{myProgram.length > 0 && (
				<div className="flex w-full max-w-md flex-col items-center gap-2">
					<span className="font-mono text-sm text-slate-500 uppercase">
						{config.yourProgramLabel}
					</span>
					<div className="flex gap-2">
						{myProgram.map((command, index) => (
							<div
								key={index}
								className={cn(
									'flex h-12 w-12 items-center justify-center rounded-sm border-2 transition-all duration-300',
									index === currentTick
										? 'border-neon-lime bg-neon-lime/20 text-neon-lime scale-110 shadow-[0_0_12px_var(--color-neon-lime)/0.3]'
										: index < currentTick
											? 'border-slate-700 bg-slate-800/50 text-slate-600'
											: 'border-slate-600 bg-slate-800/80 text-slate-300'
								)}
							>
								{COMMAND_ICONS[command]}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
