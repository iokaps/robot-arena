import { arenaStore } from '@/state/stores/arena-store';
import type {
	PickupCell,
	PickupType,
	Position,
	RobotColor,
	RobotState,
	Rotation,
	TerrainCell
} from '@/types/arena';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { ChevronUp, Heart, Shield, Skull, Zap } from 'lucide-react';
import * as React from 'react';

interface ArenaGridProps {
	/** Highlighted robot client ID (e.g., current player) */
	highlightedRobotId?: string;
	/** Size of each cell in pixels (will be capped based on grid size) */
	cellSize?: number;
	/** Maximum width of the arena in pixels */
	maxWidth?: number;
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

/**
 * Calculate optimal cell size based on grid dimensions and constraints.
 * Ensures the arena fits within maxWidth while maintaining a reasonable cell size.
 */
function calculateCellSize(
	gridWidth: number,
	gridHeight: number,
	preferredCellSize: number,
	maxWidth: number
): number {
	const maxDimension = Math.max(gridWidth, gridHeight);
	const maxCellSizeForWidth = Math.floor(maxWidth / maxDimension);
	return Math.min(preferredCellSize, maxCellSizeForWidth);
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

/** Terrain cell component for pits and conveyors */
interface TerrainCellProps {
	terrain: TerrainCell;
	cellSize: number;
}

const TerrainCellSprite: React.FC<TerrainCellProps> = ({
	terrain,
	cellSize
}) => {
	if (terrain.type === 'pit') {
		return (
			<div
				className="absolute flex items-center justify-center rounded-sm bg-gradient-to-br from-red-950 to-red-900"
				style={{
					left: terrain.position.x * cellSize + 2,
					top: terrain.position.y * cellSize + 2,
					width: cellSize - 4,
					height: cellSize - 4
				}}
			>
				<Skull className="h-1/2 w-1/2 text-red-500/60" />
			</div>
		);
	}

	if (terrain.type === 'conveyor') {
		const rotation = terrain.direction ?? 0;
		return (
			<div
				className="absolute flex items-center justify-center rounded-sm bg-amber-900/50"
				style={{
					left: terrain.position.x * cellSize + 2,
					top: terrain.position.y * cellSize + 2,
					width: cellSize - 4,
					height: cellSize - 4
				}}
			>
				<ChevronUp
					className="animate-pulse text-amber-400/70"
					style={{
						width: cellSize * 0.5,
						height: cellSize * 0.5,
						transform: `rotate(${rotation}deg)`
					}}
				/>
			</div>
		);
	}

	return null;
};

/** Pickup color and icon mapping */
const PICKUP_STYLES: Record<
	PickupType,
	{ bg: string; icon: typeof Heart; iconColor: string; glow: string }
> = {
	'health-pack': {
		bg: 'bg-red-900/60',
		icon: Heart,
		iconColor: 'text-red-400',
		glow: 'shadow-[0_0_10px_rgba(248,113,113,0.6)]'
	},
	shield: {
		bg: 'bg-blue-900/60',
		icon: Shield,
		iconColor: 'text-blue-400',
		glow: 'shadow-[0_0_10px_rgba(96,165,250,0.6)]'
	},
	'power-cell': {
		bg: 'bg-yellow-900/60',
		icon: Zap,
		iconColor: 'text-yellow-400',
		glow: 'shadow-[0_0_10px_rgba(250,204,21,0.6)]'
	}
};

/** Pickup sprite component */
interface PickupSpriteProps {
	pickup: PickupCell;
	cellSize: number;
}

const PickupSprite: React.FC<PickupSpriteProps> = ({ pickup, cellSize }) => {
	const style = PICKUP_STYLES[pickup.type];
	const Icon = style.icon;

	return (
		<div
			className={cn(
				'absolute flex items-center justify-center rounded-lg border border-white/20',
				style.bg,
				style.glow,
				'animate-pulse'
			)}
			style={{
				left: pickup.position.x * cellSize + 4,
				top: pickup.position.y * cellSize + 4,
				width: cellSize - 8,
				height: cellSize - 8
			}}
		>
			<Icon
				className={style.iconColor}
				style={{
					width: cellSize * 0.45,
					height: cellSize * 0.45
				}}
				fill="currentColor"
			/>
		</div>
	);
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

			{/* Buff indicators */}
			<div className="absolute top-0 -right-1 flex flex-col gap-0.5">
				{robot.shield > 0 && (
					<div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/80 shadow-[0_0_6px_rgba(96,165,250,0.8)]">
						<Shield className="h-3 w-3 text-white" />
					</div>
				)}
				{robot.powerBoost && (
					<div className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500/80 shadow-[0_0_6px_rgba(250,204,21,0.8)]">
						<Zap className="h-3 w-3 text-white" />
					</div>
				)}
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
	cellSize: preferredCellSize = 48,
	maxWidth = 800,
	showNames = true,
	activeShots = [],
	className
}) => {
	const { gridSize, robots, obstacles, terrain, pickups } = useSnapshot(
		arenaStore.proxy
	);

	// Calculate responsive cell size based on grid dimensions
	const cellSize = calculateCellSize(
		gridSize.width,
		gridSize.height,
		preferredCellSize,
		maxWidth
	);

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

			{/* Terrain (pits and conveyors) */}
			{Object.values(terrain).map((terrainCell) => (
				<TerrainCellSprite
					key={`terrain-${terrainCell.position.x}-${terrainCell.position.y}`}
					terrain={terrainCell}
					cellSize={cellSize}
				/>
			))}

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

			{/* Pickups */}
			{Object.values(pickups).map((pickup) => (
				<PickupSprite
					key={`pickup-${pickup.position.x}-${pickup.position.y}`}
					pickup={pickup}
					cellSize={cellSize}
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
