import { ArenaGrid } from '@/components/arena-grid';
import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { arenaStore } from '@/state/stores/arena-store';
import { matchStore } from '@/state/stores/match-store';
import { robotProgramsStore } from '@/state/stores/robot-programs-store';
import type { MoveCommand, Position, Rotation } from '@/types/arena';
import { cn } from '@/utils/cn';
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
	const { robots } = useSnapshot(arenaStore.proxy);
	const { currentTick, phase } = useSnapshot(matchStore.proxy);
	const { programs } = useSnapshot(robotProgramsStore.proxy);
	const myRobot = robots[kmClient.id];
	const myProgram = programs[kmClient.id] || [];

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

	return (
		<div className="flex w-full flex-col items-center gap-6">
			{/* Header with status */}
			<div className="flex w-full items-center justify-between">
				{/* My robot status */}
				{myRobot && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-slate-400">{config.livesLabel}</span>
						<div className="flex gap-1">
							{Array.from({ length: 3 }).map((_, i) => (
								<Heart
									key={i}
									className={cn(
										'h-5 w-5',
										i < myRobot.lives ? 'text-neon-rose' : 'text-slate-700'
									)}
									fill={i < myRobot.lives ? 'currentColor' : 'none'}
								/>
							))}
						</div>
					</div>
				)}

				{/* Execution tick indicator */}
				<div className="border-neon-fuchsia/50 bg-neon-fuchsia/10 text-neon-fuchsia flex items-center gap-2 rounded-lg border px-4 py-2">
					<span className="font-display text-lg">
						{config.tickLabel} {currentTick + 1}/5
					</span>
				</div>
			</div>

			{/* Arena */}
			<ArenaGrid
				highlightedRobotId={kmClient.id}
				cellSize={36}
				showNames={true}
				activeShots={activeShots}
			/>

			{/* My program display */}
			{myProgram.length > 0 && (
				<div className="flex w-full max-w-md flex-col items-center gap-2">
					<span className="text-sm text-slate-400">
						{config.yourProgramLabel}
					</span>
					<div className="flex gap-2">
						{myProgram.map((command, index) => (
							<div
								key={index}
								className={cn(
									'flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-all',
									index === currentTick
										? 'border-neon-lime bg-neon-lime/20 text-neon-lime scale-110'
										: index < currentTick
											? 'border-slate-600 bg-slate-800 text-slate-500'
											: 'border-slate-500 bg-slate-700 text-slate-300'
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
