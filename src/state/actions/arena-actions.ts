import { config } from '@/config';
import { resolveArenaMap } from '@/config/arena-maps';
import { kmClient } from '@/services/km-client';
import type {
	ArenaSizeId,
	MapLayout,
	MapLayoutId,
	PickupCell,
	PickupType,
	Position,
	RobotColor,
	Rotation,
	TerrainCell,
	TerrainType
} from '@/types/arena';
import type { ArenaState } from '../stores/arena-store';
import { arenaStore } from '../stores/arena-store';
import type { MatchState } from '../stores/match-store';
import { matchStore } from '../stores/match-store';
import type { PlayersState } from '../stores/players-store';
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

	// Add perimeter walls to prevent robots from falling off edges
	// Top edge
	for (let x = 0; x < width; x++) {
		obstacles[`${x},0`] = { x, y: 0 };
	}
	// Bottom edge
	for (let x = 0; x < width; x++) {
		obstacles[`${x},${height - 1}`] = { x, y: height - 1 };
	}
	// Left edge
	for (let y = 1; y < height - 1; y++) {
		obstacles[`0,${y}`] = { x: 0, y };
	}
	// Right edge
	for (let y = 1; y < height - 1; y++) {
		obstacles[`${width - 1},${y}`] = { x: width - 1, y };
	}

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

	// Calculate inner perimeter length (1 cell inside the walls)
	const innerWidth = width - 2;
	const innerHeight = height - 2;
	const perimeter = 2 * (innerWidth + innerHeight) - 4;
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
 * Spawns 1 cell inside the walls so robots aren't stuck on obstacle perimeter.
 */
function perimeterToPositionAndRotation(
	index: number,
	width: number,
	height: number
): { position: Position; rotation: Rotation } {
	// Inner perimeter dimensions (1 cell inside the walls)
	const innerWidth = width - 2;
	const innerHeight = height - 2;

	// Top edge (left to right)
	if (index < innerWidth) {
		return {
			position: { x: index + 1, y: 1 },
			rotation: 180 // Face down
		};
	}
	index -= innerWidth;

	// Right edge (top to bottom, excluding top-right corner)
	if (index < innerHeight - 1) {
		return {
			position: { x: width - 2, y: index + 2 },
			rotation: 270 // Face left
		};
	}
	index -= innerHeight - 1;

	// Bottom edge (right to left, excluding bottom-right corner)
	if (index < innerWidth - 1) {
		return {
			position: { x: width - 3 - index, y: height - 2 },
			rotation: 0 // Face up
		};
	}
	index -= innerWidth - 1;

	// Left edge (bottom to top, excluding corners)
	return {
		position: { x: 1, y: height - 3 - index },
		rotation: 90 // Face right
	};
}

/** Available pickup types for spawning */
const PICKUP_TYPES: PickupType[] = ['health-pack', 'shield', 'power-cell'];

/**
 * Generate pickups for the arena, avoiding obstacles, terrain, and robot positions.
 * Spawns 1-3 pickups based on arena size.
 */
export function generatePickups(
	gridSize: { width: number; height: number },
	obstacles: Record<string, Position>,
	terrain: Record<string, TerrainCell>,
	robotPositions: Position[]
): Record<string, PickupCell> {
	const pickups: Record<string, PickupCell> = {};
	const { width, height } = gridSize;

	// Calculate number of pickups based on arena size (1-3)
	const totalCells = width * height;
	const pickupCount = totalCells < 150 ? 1 : totalCells < 300 ? 2 : 3;

	// Create exclusion set for positions we can't use
	const excluded = new Set<string>();

	// Exclude obstacles
	for (const key of Object.keys(obstacles)) {
		excluded.add(key);
	}

	// Exclude terrain (pits, conveyors)
	for (const key of Object.keys(terrain)) {
		excluded.add(key);
	}

	// Exclude robot positions and 1-cell buffer around them
	for (const pos of robotPositions) {
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				excluded.add(`${pos.x + dx},${pos.y + dy}`);
			}
		}
	}

	// Exclude edges (wall perimeter)
	for (let x = 0; x < width; x++) {
		excluded.add(`${x},0`);
		excluded.add(`${x},${height - 1}`);
	}
	for (let y = 0; y < height; y++) {
		excluded.add(`0,${y}`);
		excluded.add(`${width - 1},${y}`);
	}

	// Try to place pickups
	let placed = 0;
	let attempts = 0;
	const maxAttempts = pickupCount * 50;

	while (placed < pickupCount && attempts < maxAttempts) {
		// Prefer center region for pickups
		const margin = Math.floor(Math.min(width, height) * 0.2);
		const x = margin + Math.floor(Math.random() * (width - 2 * margin));
		const y = margin + Math.floor(Math.random() * (height - 2 * margin));
		const key = `${x},${y}`;

		if (!excluded.has(key) && !pickups[key]) {
			const type =
				PICKUP_TYPES[Math.floor(Math.random() * PICKUP_TYPES.length)];
			pickups[key] = {
				position: { x, y },
				type
			};
			excluded.add(key);
			placed++;
		}
		attempts++;
	}

	return pickups;
}

function spawnRobotsForClientIds(
	arenaState: ArenaState,
	playersState: PlayersState,
	matchState: MatchState,
	clientIds: string[]
) {
	const uniqueClientIds = Array.from(new Set(clientIds)).filter((clientId) =>
		Boolean(playersState.players[clientId])
	);
	const playerCount = uniqueClientIds.length;

	if (playerCount < 2) {
		arenaState.robots = {};
		return;
	}

	const mapConfig = resolveArenaMap(arenaState.selectedSizeId, playerCount);

	arenaState.gridSize = { ...mapConfig.gridSize };

	const spawns = getPerimeterSpawnPositions(mapConfig.gridSize, playerCount);
	const spawnPositions = spawns.map((s) => s.position);
	const { obstacles, terrain } = generateLayoutTerrain(
		arenaState.mapLayoutId,
		mapConfig.gridSize,
		mapConfig.obstacleDensity,
		spawnPositions
	);
	arenaState.obstacles = obstacles;
	arenaState.terrain = terrain;

	arenaState.robots = {};

	uniqueClientIds.forEach((clientId, index) => {
		const spawn = spawns[index];
		const color = ROBOT_COLORS[index % ROBOT_COLORS.length];
		const playerName = playersState.players[clientId]?.name || 'Bot';

		arenaState.robots[clientId] = {
			position: { ...spawn.position },
			rotation: spawn.rotation,
			lives: 3,
			color,
			name: playerName,
			shield: 0,
			powerBoost: false
		};
	});

	matchState.eliminatedPlayers = {};

	const robotPositions = Object.values(arenaState.robots).map(
		(r) => r.position
	);
	arenaState.pickups = generatePickups(
		mapConfig.gridSize,
		arenaState.obstacles,
		arenaState.terrain,
		robotPositions
	);

	arenaState.mapVotes = {};
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

	/** Set current player's map vote in lobby */
	async setMapVote(layoutId: MapLayoutId) {
		await kmClient.transact(
			[arenaStore, matchStore],
			([arenaState, matchState]) => {
				if (matchState.phase !== 'lobby') return;
				arenaState.mapVotes[kmClient.id] = layoutId;
			}
		);
	},

	/** Spawn robots for all registered players */
	async spawnRobots() {
		await kmClient.transact(
			[arenaStore, playersStore, matchStore],
			([arenaState, playersState, matchState]) => {
				spawnRobotsForClientIds(
					arenaState,
					playersState,
					matchState,
					Object.keys(playersState.players)
				);
			}
		);
	},

	/** Spawn robots for specific player IDs (used for rematch with locked roster) */
	async spawnRobotsForPlayerIds(clientIds: string[]) {
		await kmClient.transact(
			[arenaStore, playersStore, matchStore],
			([arenaState, playersState, matchState]) => {
				spawnRobotsForClientIds(
					arenaState,
					playersState,
					matchState,
					clientIds
				);
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
			arenaState.pickups = {};
		});
	}
};
