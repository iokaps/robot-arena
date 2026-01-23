import { kmClient } from '@/services/km-client';
import type {
	MapLayout,
	MapLayoutId,
	Position,
	RobotColor,
	Rotation
} from '@/types/arena';
import { arenaStore } from '../stores/arena-store';
import { matchStore } from '../stores/match-store';
import { playersStore } from '../stores/players-store';

/** Available robot colors in assignment order */
const ROBOT_COLORS: RobotColor[] = [
	'cyan',
	'fuchsia',
	'lime',
	'orange',
	'rose',
	'violet'
];

/** Pre-defined map layouts */
export const MAP_LAYOUTS: Record<MapLayoutId, MapLayout> = {
	open: {
		id: 'open',
		name: 'Open Arena',
		obstacles: [
			{ x: 2, y: 2 },
			{ x: 7, y: 2 },
			{ x: 2, y: 7 },
			{ x: 7, y: 7 }
		]
	},
	cross: {
		id: 'cross',
		name: 'Cross',
		obstacles: [
			// Vertical bar
			{ x: 4, y: 2 },
			{ x: 4, y: 3 },
			{ x: 5, y: 2 },
			{ x: 5, y: 3 },
			{ x: 4, y: 6 },
			{ x: 4, y: 7 },
			{ x: 5, y: 6 },
			{ x: 5, y: 7 },
			// Horizontal bar
			{ x: 2, y: 4 },
			{ x: 3, y: 4 },
			{ x: 2, y: 5 },
			{ x: 3, y: 5 },
			{ x: 6, y: 4 },
			{ x: 7, y: 4 },
			{ x: 6, y: 5 },
			{ x: 7, y: 5 }
		]
	},
	maze: {
		id: 'maze',
		name: 'Maze',
		obstacles: [
			// Scattered walls creating corridors
			{ x: 2, y: 1 },
			{ x: 2, y: 2 },
			{ x: 5, y: 1 },
			{ x: 7, y: 2 },
			{ x: 7, y: 3 },
			{ x: 1, y: 4 },
			{ x: 1, y: 5 },
			{ x: 3, y: 4 },
			{ x: 4, y: 4 },
			{ x: 4, y: 5 },
			{ x: 6, y: 5 },
			{ x: 8, y: 4 },
			{ x: 8, y: 5 },
			{ x: 2, y: 7 },
			{ x: 2, y: 8 },
			{ x: 4, y: 7 },
			{ x: 5, y: 8 },
			{ x: 7, y: 7 },
			{ x: 7, y: 8 }
		]
	}
};

/** Corner spawn positions for ≤4 players */
const CORNER_SPAWNS: { position: Position; rotation: Rotation }[] = [
	{ position: { x: 0, y: 0 }, rotation: 180 }, // Top-left, facing down
	{ position: { x: 9, y: 0 }, rotation: 180 }, // Top-right, facing down
	{ position: { x: 0, y: 9 }, rotation: 0 }, // Bottom-left, facing up
	{ position: { x: 9, y: 9 }, rotation: 0 } // Bottom-right, facing up
];

/**
 * Get a random empty position on the grid
 */
function getRandomEmptyPosition(
	gridSize: { width: number; height: number },
	occupiedPositions: Set<string>,
	obstacles: Set<string>
): Position {
	let attempts = 0;
	while (attempts < 100) {
		const x = Math.floor(Math.random() * gridSize.width);
		const y = Math.floor(Math.random() * gridSize.height);
		const key = `${x},${y}`;

		if (!occupiedPositions.has(key) && !obstacles.has(key)) {
			return { x, y };
		}
		attempts++;
	}
	// Fallback - should not happen with reasonable grid sizes
	return { x: 0, y: 0 };
}

/**
 * Check if two positions are at least minDistance apart
 */
function arePositionsFarEnough(
	pos1: Position,
	pos2: Position,
	minDistance: number
): boolean {
	const dx = Math.abs(pos1.x - pos2.x);
	const dy = Math.abs(pos1.y - pos2.y);
	return Math.max(dx, dy) >= minDistance;
}

/**
 * Actions for arena state mutations
 */
export const arenaActions = {
	/** Set the map layout */
	async setMapLayout(layoutId: MapLayoutId) {
		const layout = MAP_LAYOUTS[layoutId];
		if (!layout) return;

		await kmClient.transact([arenaStore], ([arenaState]) => {
			arenaState.mapLayoutId = layoutId;
			arenaState.obstacles = {};
			for (const pos of layout.obstacles) {
				arenaState.obstacles[`${pos.x},${pos.y}`] = pos;
			}
		});
	},

	/** Spawn robots for all registered players */
	async spawnRobots() {
		await kmClient.transact(
			[arenaStore, playersStore, matchStore],
			([arenaState, playersState, matchState]) => {
				const playerIds = Object.keys(playersState.players);
				const playerCount = playerIds.length;

				// Clear existing robots
				arenaState.robots = {};

				// Build obstacle set for collision checking
				const obstacleSet = new Set(Object.keys(arenaState.obstacles));
				const occupiedPositions = new Set<string>();

				// Assign spawns
				if (playerCount <= 4) {
					// Use corner spawns
					playerIds.forEach((clientId, index) => {
						const spawn = CORNER_SPAWNS[index];
						const color = ROBOT_COLORS[index % ROBOT_COLORS.length];
						const playerName = playersState.players[clientId]?.name || 'Bot';

						arenaState.robots[clientId] = {
							position: { ...spawn.position },
							rotation: spawn.rotation,
							lives: 3,
							color,
							name: playerName
						};

						occupiedPositions.add(`${spawn.position.x},${spawn.position.y}`);
					});
				} else {
					// Random spawns for >4 players
					const spawnedPositions: Position[] = [];

					playerIds.forEach((clientId, index) => {
						let position: Position;
						let attempts = 0;

						// Find position at least 3 cells away from others
						do {
							position = getRandomEmptyPosition(
								arenaState.gridSize,
								occupiedPositions,
								obstacleSet
							);
							attempts++;
						} while (
							attempts < 50 &&
							spawnedPositions.some(
								(p) => !arePositionsFarEnough(p, position, 3)
							)
						);

						const color = ROBOT_COLORS[index % ROBOT_COLORS.length];
						const playerName = playersState.players[clientId]?.name || 'Bot';

						// Random initial rotation
						const rotations: Rotation[] = [0, 90, 180, 270];
						const rotation =
							rotations[Math.floor(Math.random() * rotations.length)];

						arenaState.robots[clientId] = {
							position,
							rotation,
							lives: 3,
							color,
							name: playerName
						};

						occupiedPositions.add(`${position.x},${position.y}`);
						spawnedPositions.push(position);
					});
				}

				// Reset eliminated players
				matchState.eliminatedPlayers = {};
			}
		);
	},

	/** Apply damage to a robot */
	async applyDamage(clientId: string, damage: number) {
		await kmClient.transact(
			[arenaStore, matchStore],
			([arenaState, matchState]) => {
				const robot = arenaState.robots[clientId];
				if (!robot) return;

				robot.lives = Math.max(0, robot.lives - damage);

				if (robot.lives === 0) {
					matchState.eliminatedPlayers[clientId] = true;
					// Don't delete robot - keep it for rendering (filtered by lives > 0)
				}
			}
		);
	},

	/** Reset arena to initial state */
	async resetArena() {
		await kmClient.transact([arenaStore], ([arenaState]) => {
			arenaState.robots = {};
		});
	}
};
