import { config } from '@/config';
import { resolveArenaMap } from '@/config/arena-maps';
import { kmClient } from '@/services/km-client';
import type {
	ArenaSizeId,
	MapLayout,
	MapLayoutId,
	Position,
	RobotColor,
	Rotation,
	TerrainCell,
	TerrainType
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

/** Pre-defined map layouts (obstacle patterns) */
export const MAP_LAYOUTS: Record<MapLayoutId, MapLayout> = {
	open: {
		id: 'open',
		name: config.mapOpenLabel,
		obstacles: []
	},
	cross: {
		id: 'cross',
		name: config.mapCrossLabel,
		obstacles: []
	},
	maze: {
		id: 'maze',
		name: config.mapMazeLabel,
		obstacles: []
	},
	gauntlet: {
		id: 'gauntlet',
		name: config.mapGauntletLabel,
		obstacles: []
	},
	factory: {
		id: 'factory',
		name: config.mapFactoryLabel,
		obstacles: []
	},
	deathtrap: {
		id: 'deathtrap',
		name: config.mapDeathtrapLabel,
		obstacles: []
	}
};

/**
 * Generate terrain for a given grid size based on layout pattern.
 * Returns both obstacles (walls) and terrain (pits, conveyors).
 */
export function generateLayoutTerrain(
	layoutId: MapLayoutId,
	gridSize: { width: number; height: number },
	density: number,
	spawnZones: Position[]
): {
	obstacles: Record<string, Position>;
	terrain: Record<string, TerrainCell>;
} {
	const obstacles: Record<string, Position> = {};
	const terrain: Record<string, TerrainCell> = {};
	const { width, height } = gridSize;
	const centerX = Math.floor(width / 2);
	const centerY = Math.floor(height / 2);

	// Create spawn zone set for exclusion (2-cell buffer around spawns)
	const spawnExclusion = new Set<string>();
	for (const zone of spawnZones) {
		for (let dx = -2; dx <= 2; dx++) {
			for (let dy = -2; dy <= 2; dy++) {
				spawnExclusion.add(`${zone.x + dx},${zone.y + dy}`);
			}
		}
	}

	const canPlace = (x: number, y: number): boolean => {
		const key = `${x},${y}`;
		return (
			x >= 0 &&
			x < width &&
			y >= 0 &&
			y < height &&
			!spawnExclusion.has(key) &&
			!obstacles[key] &&
			!terrain[key]
		);
	};

	const addObstacle = (x: number, y: number) => {
		if (canPlace(x, y)) {
			obstacles[`${x},${y}`] = { x, y };
		}
	};

	const addTerrain = (
		x: number,
		y: number,
		type: TerrainType,
		direction?: Rotation
	) => {
		if (canPlace(x, y)) {
			terrain[`${x},${y}`] = { position: { x, y }, type, direction };
		}
	};

	switch (layoutId) {
		case 'open': {
			// Scattered corner obstacles
			const offset = Math.floor(Math.min(width, height) * 0.25);
			addObstacle(offset, offset);
			addObstacle(width - 1 - offset, offset);
			addObstacle(offset, height - 1 - offset);
			addObstacle(width - 1 - offset, height - 1 - offset);

			// Add center obstacles for larger maps
			if (width >= 14) {
				addObstacle(centerX - 1, centerY);
				addObstacle(centerX + 1, centerY);
			}
			break;
		}

		case 'cross': {
			// Cross pattern scaled to grid
			const armLength = Math.floor(Math.min(width, height) * 0.15);
			const armOffset = Math.floor(Math.min(width, height) * 0.2);

			// Top arm
			for (let i = 0; i < armLength; i++) {
				addObstacle(centerX, armOffset + i);
				addObstacle(centerX - 1, armOffset + i);
			}
			// Bottom arm
			for (let i = 0; i < armLength; i++) {
				addObstacle(centerX, height - 1 - armOffset - i);
				addObstacle(centerX - 1, height - 1 - armOffset - i);
			}
			// Left arm
			for (let i = 0; i < armLength; i++) {
				addObstacle(armOffset + i, centerY);
				addObstacle(armOffset + i, centerY - 1);
			}
			// Right arm
			for (let i = 0; i < armLength; i++) {
				addObstacle(width - 1 - armOffset - i, centerY);
				addObstacle(width - 1 - armOffset - i, centerY - 1);
			}
			break;
		}

		case 'maze': {
			// Random scattered obstacles
			const totalCells = width * height;
			const targetCount = Math.floor(totalCells * density);
			let placed = 0;
			let attempts = 0;

			while (placed < targetCount && attempts < targetCount * 10) {
				const x = Math.floor(Math.random() * width);
				const y = Math.floor(Math.random() * height);
				if (canPlace(x, y)) {
					addObstacle(x, y);
					placed++;
				}
				attempts++;
			}
			break;
		}

		case 'gauntlet': {
			// Central corridor with pits on sides, conveyors pushing toward center
			const corridorWidth = Math.max(4, Math.floor(width * 0.3));
			const corridorStart = Math.floor((width - corridorWidth) / 2);
			const corridorEnd = corridorStart + corridorWidth;

			// Add pits on both sides of the corridor
			for (let y = 2; y < height - 2; y++) {
				// Left side pits
				if (corridorStart > 2) {
					addTerrain(corridorStart - 1, y, 'pit');
				}
				// Right side pits
				if (corridorEnd < width - 2) {
					addTerrain(corridorEnd, y, 'pit');
				}
			}

			// Add conveyors pushing toward center at top and bottom
			for (let x = 2; x < width - 2; x++) {
				if (x < centerX - 1) {
					addTerrain(x, 1, 'conveyor', 90); // Push right
					addTerrain(x, height - 2, 'conveyor', 90);
				} else if (x > centerX) {
					addTerrain(x, 1, 'conveyor', 270); // Push left
					addTerrain(x, height - 2, 'conveyor', 270);
				}
			}

			// Add some walls for cover
			addObstacle(centerX, Math.floor(height * 0.3));
			addObstacle(centerX - 1, Math.floor(height * 0.7));
			break;
		}

		case 'factory': {
			// Conveyor belt network with walls
			const beltSpacing = Math.max(3, Math.floor(width / 4));

			// Horizontal conveyor lanes
			for (let x = 2; x < width - 2; x++) {
				// Top lane going right
				addTerrain(x, beltSpacing, 'conveyor', 90);
				// Bottom lane going left
				addTerrain(x, height - 1 - beltSpacing, 'conveyor', 270);
			}

			// Vertical conveyor lanes
			for (let y = beltSpacing + 1; y < height - 1 - beltSpacing; y++) {
				// Left side going down
				addTerrain(beltSpacing, y, 'conveyor', 180);
				// Right side going up
				addTerrain(width - 1 - beltSpacing, y, 'conveyor', 0);
			}

			// Add walls in center
			addObstacle(centerX, centerY);
			addObstacle(centerX - 1, centerY);
			addObstacle(centerX + 1, centerY);
			addObstacle(centerX, centerY - 1);
			addObstacle(centerX, centerY + 1);
			break;
		}

		case 'deathtrap': {
			// Checkered pattern of pits and walls
			const pitSpacing = Math.max(3, Math.floor(Math.min(width, height) / 5));

			for (let x = pitSpacing; x < width - pitSpacing; x += pitSpacing) {
				for (let y = pitSpacing; y < height - pitSpacing; y += pitSpacing) {
					// Alternate between pit and wall
					if ((x + y) % (pitSpacing * 2) === 0) {
						addTerrain(x, y, 'pit');
					} else {
						addObstacle(x, y);
					}
				}
			}

			// Add conveyors around the edge pushing inward
			for (let x = 2; x < width - 2; x++) {
				addTerrain(x, 1, 'conveyor', 180); // Push down
				addTerrain(x, height - 2, 'conveyor', 0); // Push up
			}
			for (let y = 2; y < height - 2; y++) {
				addTerrain(1, y, 'conveyor', 90); // Push right
				addTerrain(width - 2, y, 'conveyor', 270); // Push left
			}
			break;
		}
	}

	return { obstacles, terrain };
}

/**
 * Calculate spawn positions around the perimeter of the arena.
 * Distributes players evenly, facing toward the center.
 */
function getPerimeterSpawnPositions(
	gridSize: { width: number; height: number },
	playerCount: number
): Array<{ position: Position; rotation: Rotation }> {
	const spawns: Array<{ position: Position; rotation: Rotation }> = [];
	const { width, height } = gridSize;

	// Calculate perimeter length (excluding corners counted twice)
	const perimeter = 2 * (width + height) - 4;
	const spacing = perimeter / playerCount;

	for (let i = 0; i < playerCount; i++) {
		const perimeterPos = Math.floor(i * spacing + spacing / 2) % perimeter;
		const { position, rotation } = perimeterToPositionAndRotation(
			perimeterPos,
			width,
			height
		);
		spawns.push({ position, rotation });
	}

	return spawns;
}

/**
 * Convert perimeter index to grid position and rotation facing center.
 */
function perimeterToPositionAndRotation(
	index: number,
	width: number,
	height: number
): { position: Position; rotation: Rotation } {
	// Top edge (left to right)
	if (index < width) {
		return {
			position: { x: index, y: 0 },
			rotation: 180 // Face down
		};
	}
	index -= width;

	// Right edge (top to bottom, excluding top-right corner)
	if (index < height - 1) {
		return {
			position: { x: width - 1, y: index + 1 },
			rotation: 270 // Face left
		};
	}
	index -= height - 1;

	// Bottom edge (right to left, excluding bottom-right corner)
	if (index < width - 1) {
		return {
			position: { x: width - 2 - index, y: height - 1 },
			rotation: 0 // Face up
		};
	}
	index -= width - 1;

	// Left edge (bottom to top, excluding corners)
	return {
		position: { x: 0, y: height - 2 - index },
		rotation: 90 // Face right
	};
}

/**
 * Actions for arena state mutations
 */
export const arenaActions = {
	/** Set the map layout (obstacle pattern) */
	async setMapLayout(layoutId: MapLayoutId) {
		await kmClient.transact([arenaStore], ([arenaState]) => {
			arenaState.mapLayoutId = layoutId;
		});
	},

	/** Set the arena size selection */
	async setArenaSize(sizeId: ArenaSizeId) {
		await kmClient.transact([arenaStore], ([arenaState]) => {
			arenaState.selectedSizeId = sizeId;
		});
	},

	/** Spawn robots for all registered players */
	async spawnRobots() {
		await kmClient.transact(
			[arenaStore, playersStore, matchStore],
			([arenaState, playersState, matchState]) => {
				const playerIds = Object.keys(playersState.players);
				const playerCount = playerIds.length;

				if (playerCount < 2) return;

				// Resolve arena map based on selection (auto or manual)
				const mapConfig = resolveArenaMap(
					arenaState.selectedSizeId,
					playerCount
				);

				// Update grid size
				arenaState.gridSize = { ...mapConfig.gridSize };

				// Get spawn positions for players
				const spawns = getPerimeterSpawnPositions(
					mapConfig.gridSize,
					playerCount
				);

				// Generate obstacles and terrain avoiding spawn positions
				const spawnPositions = spawns.map((s) => s.position);
				const { obstacles, terrain } = generateLayoutTerrain(
					arenaState.mapLayoutId,
					mapConfig.gridSize,
					mapConfig.obstacleDensity,
					spawnPositions
				);
				arenaState.obstacles = obstacles;
				arenaState.terrain = terrain;

				// Clear existing robots and spawn new ones
				arenaState.robots = {};

				playerIds.forEach((clientId, index) => {
					const spawn = spawns[index];
					const color = ROBOT_COLORS[index % ROBOT_COLORS.length];
					const playerName = playersState.players[clientId]?.name || 'Bot';

					arenaState.robots[clientId] = {
						position: { ...spawn.position },
						rotation: spawn.rotation,
						lives: 3,
						color,
						name: playerName
					};
				});

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
			arenaState.terrain = {};
		});
	}
};
