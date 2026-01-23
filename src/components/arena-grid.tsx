import { arenaStore } from '@/state/stores/arena-store';
import type { Position, RobotColor, RobotState, Rotation } from '@/types/arena';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { Heart } from 'lucide-react';
import * as React from 'react';

interface ArenaGridProps {
	/** Highlighted robot client ID (e.g., current player) */
	highlightedRobotId?: string;
	/** Size of each cell in pixels */
	cellSize?: number;
	/** Whether to show player names */
	showNames?: boolean;
	/** Active laser shots to animate */
	activeShots?: Array<{
		from: Position;
		direction: Rotation;
		shooterId: string;
	}>;
	/** Optional className */
	className?: string;
}

/** Color mapping for robot colors to Tailwind classes */
const ROBOT_COLOR_CLASSES: Record<
	RobotColor,
	{ bg: string; border: string; text: string; glow: string }
> = {
	cyan: {
		bg: 'bg-neon-cyan',
		border: 'border-neon-cyan',
		text: 'text-neon-cyan',
		glow: 'shadow-[0_0_15px_var(--color-neon-cyan)]'
	},
	fuchsia: {
		bg: 'bg-neon-fuchsia',
		border: 'border-neon-fuchsia',
		text: 'text-neon-fuchsia',
		glow: 'shadow-[0_0_15px_var(--color-neon-fuchsia)]'
	},
	lime: {
		bg: 'bg-neon-lime',
		border: 'border-neon-lime',
		text: 'text-neon-lime',
		glow: 'shadow-[0_0_15px_var(--color-neon-lime)]'
	},
	orange: {
		bg: 'bg-neon-orange',
		border: 'border-neon-orange',
		text: 'text-neon-orange',
		glow: 'shadow-[0_0_15px_var(--color-neon-orange)]'
	},
	rose: {
		bg: 'bg-neon-rose',
		border: 'border-neon-rose',
		text: 'text-neon-rose',
		glow: 'shadow-[0_0_15px_var(--color-neon-rose)]'
	},
	violet: {
		bg: 'bg-neon-violet',
		border: 'border-neon-violet',
		text: 'text-neon-violet',
		glow: 'shadow-[0_0_15px_var(--color-neon-violet)]'
	}
};

/** Rotation degrees for robot facing direction */
const ROTATION_DEGREES: Record<Rotation, number> = {
	0: 0, // Up
	90: 90, // Right
	180: 180, // Down
	270: 270 // Left
};

interface RobotSpriteProps {
	robot: RobotState;
	isHighlighted?: boolean;
	showName?: boolean;
	cellSize: number;
}

const RobotSprite: React.FC<RobotSpriteProps> = ({
	robot,
	isHighlighted,
	showName,
	cellSize
}) => {
	const colors = ROBOT_COLOR_CLASSES[robot.color];
	const rotationDeg = ROTATION_DEGREES[robot.rotation];

	return (
		<div
			className={cn(
				'absolute flex flex-col items-center justify-center transition-all duration-500 ease-out',
				isHighlighted && 'z-10'
			)}
			style={{
				left: robot.position.x * cellSize,
				top: robot.position.y * cellSize,
				width: cellSize,
				height: cellSize
			}}
		>
			{/* Robot body */}
			<div
				className={cn(
					'relative flex items-center justify-center rounded-lg border-2 transition-all duration-300',
					colors.bg,
					colors.border,
					isHighlighted && colors.glow,
					'bg-opacity-80'
				)}
				style={{
					width: cellSize * 0.7,
					height: cellSize * 0.7,
					transform: `rotate(${rotationDeg}deg)`
				}}
			>
				{/* Direction indicator (triangle pointing up) */}
				<div className="absolute -top-1 left-1/2 -translate-x-1/2 border-r-[6px] border-b-[10px] border-l-[6px] border-r-transparent border-b-slate-900 border-l-transparent" />
			</div>

			{/* Lives display */}
			<div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
				{Array.from({ length: 3 }).map((_, i) => (
					<Heart
						key={i}
						className={cn(
							'h-3 w-3',
							i < robot.lives ? colors.text : 'text-slate-700'
						)}
						fill={i < robot.lives ? 'currentColor' : 'none'}
					/>
				))}
			</div>

			{/* Player name */}
			{showName && (
				<div
					className={cn(
						'absolute -top-5 left-1/2 -translate-x-1/2 rounded px-1 text-xs font-medium whitespace-nowrap',
						colors.text,
						'bg-slate-900/80'
					)}
				>
					{robot.name}
				</div>
			)}
		</div>
	);
};

interface LaserBeamProps {
	from: Position;
	direction: Rotation;
	gridSize: { width: number; height: number };
	obstacles: Record<string, Position>;
	robots: Record<string, RobotState>;
	shooterId: string;
	cellSize: number;
	color: RobotColor;
}

const LaserBeam: React.FC<LaserBeamProps> = ({
	from,
	direction,
	gridSize,
	obstacles,
	robots,
	shooterId,
	cellSize,
	color
}) => {
	const colors = ROBOT_COLOR_CLASSES[color];

	// Calculate laser endpoint
	let endX = from.x;
	let endY = from.y;

	const dx = direction === 90 ? 1 : direction === 270 ? -1 : 0;
	const dy = direction === 180 ? 1 : direction === 0 ? -1 : 0;

	while (true) {
		const nextX = endX + dx;
		const nextY = endY + dy;

		// Check bounds
		if (
			nextX < 0 ||
			nextX >= gridSize.width ||
			nextY < 0 ||
			nextY >= gridSize.height
		) {
			break;
		}

		// Check obstacle
		if (obstacles[`${nextX},${nextY}`]) {
			break;
		}

		// Check robot hit (only alive robots)
		const hitRobot = Object.entries(robots).find(
			([id, robot]) =>
				id !== shooterId &&
				robot.lives > 0 &&
				robot.position.x === nextX &&
				robot.position.y === nextY
		);
		if (hitRobot) {
			endX = nextX;
			endY = nextY;
			break;
		}

		endX = nextX;
		endY = nextY;
	}

	// Calculate beam position and size
	const startCenterX = from.x * cellSize + cellSize / 2;
	const startCenterY = from.y * cellSize + cellSize / 2;
	const endCenterX = endX * cellSize + cellSize / 2;
	const endCenterY = endY * cellSize + cellSize / 2;

	const length = Math.sqrt(
		Math.pow(endCenterX - startCenterX, 2) +
			Math.pow(endCenterY - startCenterY, 2)
	);

	const angle =
		Math.atan2(endCenterY - startCenterY, endCenterX - startCenterX) *
		(180 / Math.PI);

	return (
		<div
			className={cn(
				'absolute h-1 origin-left animate-pulse',
				colors.bg,
				colors.glow
			)}
			style={{
				left: startCenterX,
				top: startCenterY - 2,
				width: length,
				transform: `rotate(${angle}deg)`
			}}
		/>
	);
};

/**
 * Arena grid component displaying the battle arena
 */
export const ArenaGrid: React.FC<ArenaGridProps> = ({
	highlightedRobotId,
	cellSize = 48,
	showNames = true,
	activeShots = [],
	className
}) => {
	const { gridSize, robots, obstacles } = useSnapshot(arenaStore.proxy);

	const gridWidth = gridSize.width * cellSize;
	const gridHeight = gridSize.height * cellSize;

	return (
		<div
			className={cn(
				'bg-arena-bg relative overflow-hidden rounded-xl border-2 border-slate-700',
				className
			)}
			style={{ width: gridWidth, height: gridHeight }}
		>
			{/* Grid lines */}
			<svg
				className="pointer-events-none absolute inset-0"
				width={gridWidth}
				height={gridHeight}
			>
				{/* Vertical lines */}
				{Array.from({ length: gridSize.width + 1 }).map((_, i) => (
					<line
						key={`v-${i}`}
						x1={i * cellSize}
						y1={0}
						x2={i * cellSize}
						y2={gridHeight}
						className="stroke-arena-grid"
						strokeWidth={1}
					/>
				))}
				{/* Horizontal lines */}
				{Array.from({ length: gridSize.height + 1 }).map((_, i) => (
					<line
						key={`h-${i}`}
						x1={0}
						y1={i * cellSize}
						x2={gridWidth}
						y2={i * cellSize}
						className="stroke-arena-grid"
						strokeWidth={1}
					/>
				))}
			</svg>

			{/* Obstacles */}
			{Object.values(obstacles).map((pos) => (
				<div
					key={`obstacle-${pos.x}-${pos.y}`}
					className="bg-arena-obstacle absolute rounded border border-slate-600"
					style={{
						left: pos.x * cellSize + 2,
						top: pos.y * cellSize + 2,
						width: cellSize - 4,
						height: cellSize - 4
					}}
				/>
			))}

			{/* Laser beams */}
			{activeShots.map((shot, i) => {
				const shooter = robots[shot.shooterId];
				if (!shooter) return null;
				return (
					<LaserBeam
						key={`shot-${i}`}
						from={shot.from}
						direction={shot.direction}
						gridSize={gridSize}
						obstacles={obstacles}
						robots={robots}
						shooterId={shot.shooterId}
						cellSize={cellSize}
						color={shooter.color}
					/>
				);
			})}

			{/* Robots */}
			{Object.entries(robots)
				.filter(([, robot]) => robot.lives > 0)
				.map(([clientId, robot]) => (
					<RobotSprite
						key={clientId}
						robot={robot}
						isHighlighted={clientId === highlightedRobotId}
						showName={showNames}
						cellSize={cellSize}
					/>
				))}
		</div>
	);
};
