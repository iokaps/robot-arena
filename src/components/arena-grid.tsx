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
import { ChibiRobot } from './chibi-robot';

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
		glow: 'shadow-[0_0_8px_var(--color-neon-cyan)]'
	},
	fuchsia: {
		bg: 'bg-neon-fuchsia',
		border: 'border-neon-fuchsia',
		text: 'text-neon-fuchsia',
		glow: 'shadow-[0_0_8px_var(--color-neon-fuchsia)]'
	},
	lime: {
		bg: 'bg-neon-lime',
		border: 'border-neon-lime',
		text: 'text-neon-lime',
		glow: 'shadow-[0_0_8px_var(--color-neon-lime)]'
	},
	orange: {
		bg: 'bg-neon-orange',
		border: 'border-neon-orange',
		text: 'text-neon-orange',
		glow: 'shadow-[0_0_8px_var(--color-neon-orange)]'
	},
	rose: {
		bg: 'bg-neon-rose',
		border: 'border-neon-rose',
		text: 'text-neon-rose',
		glow: 'shadow-[0_0_8px_var(--color-neon-rose)]'
	},
	violet: {
		bg: 'bg-neon-violet',
		border: 'border-neon-violet',
		text: 'text-neon-violet',
		glow: 'shadow-[0_0_8px_var(--color-neon-violet)]'
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
				className="border-neon-rose/50 absolute flex items-center justify-center border-2 bg-slate-950"
				style={{
					left: terrain.position.x * cellSize + 2,
					top: terrain.position.y * cellSize + 2,
					width: cellSize - 4,
					height: cellSize - 4
				}}
			>
				<Skull className="text-neon-rose/70 h-1/2 w-1/2" />
			</div>
		);
	}

	if (terrain.type === 'conveyor') {
		const rotation = terrain.direction ?? 0;
		return (
			<div
				className="border-neon-fuchsia/40 absolute flex items-center justify-center border-2 bg-slate-900/80"
				style={{
					left: terrain.position.x * cellSize + 2,
					top: terrain.position.y * cellSize + 2,
					width: cellSize - 4,
					height: cellSize - 4
				}}
			>
				<ChevronUp
					className="text-neon-fuchsia/80"
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
	{ bg: string; icon: typeof Heart; iconColor: string; border: string }
> = {
	'health-pack': {
		bg: 'bg-slate-800',
		icon: Heart,
		iconColor: 'text-neon-rose',
		border: 'border-neon-rose/60'
	},
	shield: {
		bg: 'bg-slate-800',
		icon: Shield,
		iconColor: 'text-neon-cyan',
		border: 'border-neon-cyan/60'
	},
	'power-cell': {
		bg: 'bg-slate-800',
		icon: Zap,
		iconColor: 'text-neon-orange',
		border: 'border-neon-orange/60'
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
				'absolute flex items-center justify-center border-2',
				style.bg,
				style.border
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
	isBroken?: boolean;
}

const RobotSprite: React.FC<RobotSpriteProps> = ({
	robot,
	isHighlighted,
	showName,
	cellSize,
	isBroken = false
}) => {
	const colors = ROBOT_COLOR_CLASSES[robot.color];
	const rotationDeg = ROTATION_DEGREES[robot.rotation];
	const chibiSize = cellSize * 0.85;

	return (
		<div
			className={cn(
				'absolute flex flex-col items-center justify-center transition-all duration-300 ease-out',
				isHighlighted && 'z-10'
			)}
			style={{
				left: robot.position.x * cellSize,
				top: robot.position.y * cellSize,
				width: cellSize,
				height: cellSize
			}}
		>
			{/* Chibi Robot */}
			<div
				style={{
					transform: `rotate(${rotationDeg}deg)`,
					transition: 'transform 0.2s ease-out'
				}}
			>
				<ChibiRobot
					color={robot.color}
					lives={robot.lives}
					size={chibiSize}
					hasShield={robot.shield > 0}
					hasPowerBoost={robot.powerBoost}
					isHighlighted={isHighlighted}
					isBroken={isBroken}
				/>
			</div>

			{/* Power boost indicator (shown as small lightning when active) */}
			{robot.powerBoost && !isBroken && (
				<div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/80">
					<Zap className="text-neon-orange h-3 w-3" fill="currentColor" />
				</div>
			)}

			{/* Lives display (hidden when broken) */}
			{!isBroken && (
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
			)}

			{/* Player name (hidden when broken) */}
			{showName && !isBroken && (
				<div
					className={cn(
						'absolute -top-5 left-1/2 -translate-x-1/2 border border-slate-600 bg-slate-900/90 px-1 font-mono text-xs font-medium tracking-wide whitespace-nowrap uppercase',
						colors.text
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
			className={cn('absolute h-1 origin-left', colors.bg, 'opacity-90')}
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

	// Track robots that have completed their broken animation and should be hidden
	const [hiddenRobots, setHiddenRobots] = React.useState<Set<string>>(
		new Set()
	);
	// Track robots currently showing broken animation
	const [brokenRobots, setBrokenRobots] = React.useState<Set<string>>(
		new Set()
	);

	// Detect newly eliminated robots and trigger broken animation
	React.useEffect(() => {
		const robotEntries = Object.entries(robots);
		for (const [clientId, robot] of robotEntries) {
			// Robot just died (lives went to 0) and hasn't been marked as broken yet
			if (
				robot.lives <= 0 &&
				!brokenRobots.has(clientId) &&
				!hiddenRobots.has(clientId)
			) {
				// Start broken animation
				setBrokenRobots((prev) => new Set(prev).add(clientId));

				// Hide after 1.5s animation completes
				setTimeout(() => {
					setHiddenRobots((prev) => new Set(prev).add(clientId));
				}, 1500);
			}
		}
	}, [robots, brokenRobots, hiddenRobots]);

	// Reset hidden/broken state when robots are reset (new round/match)
	React.useEffect(() => {
		const allAlive = Object.values(robots).every((r) => r.lives > 0);
		if (allAlive && (hiddenRobots.size > 0 || brokenRobots.size > 0)) {
			setHiddenRobots(new Set());
			setBrokenRobots(new Set());
		}
	}, [robots, hiddenRobots.size, brokenRobots.size]);

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
				'bg-arena-bg relative overflow-hidden border-2 border-slate-500',
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
						strokeWidth={1.5}
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
						strokeWidth={1.5}
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
					className="bg-arena-obstacle absolute border-2 border-slate-500"
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
				.filter(([clientId]) => !hiddenRobots.has(clientId))
				.map(([clientId, robot]) => (
					<RobotSprite
						key={clientId}
						robot={robot}
						isHighlighted={clientId === highlightedRobotId}
						showName={showNames}
						cellSize={cellSize}
						isBroken={brokenRobots.has(clientId)}
					/>
				))}
		</div>
	);
};
