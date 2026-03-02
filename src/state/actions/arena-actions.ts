import { config } from '@/config';
import {
	MAX_ARENA_PLAYERS,
	MIN_ARENA_PLAYERS,
	resolveArenaMap
} from '@/config/arena-maps';
import { kmClient } from '@/services/km-client';
import type {
	MapLayout,
	MapLayoutId,
	PickupCell,
	PickupType,
	Position,
	RobotColor,
	Rotation,
	TerrainCell
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
	}
};

/** Runtime-safe map layout resolver to guard against stale persisted IDs. */
export function sanitizeMapLayoutId(layoutId: unknown): MapLayoutId {
	if (typeof layoutId === 'string' && layoutId in MAP_LAYOUTS) {
		return layoutId as MapLayoutId;
	}
	return 'open';
}

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
	void density;

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

	void layoutId;

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

/**
 * Apply round-based hazard escalation by shrinking the safe area inward.
 *
 * Round 1: base map terrain only.
 * Round 2+: every N rounds adds one hazard ring from the outside inward.
 * Ring cells become pits, with conveyors at side midpoints pushing toward center.
 */
export function applyHazardEscalation(
	baseTerrain: Record<string, TerrainCell>,
	obstacles: Record<string, Position>,
	gridSize: { width: number; height: number },
	currentRound: number
): Record<string, TerrainCell> {
	const escalatedTerrain: Record<string, TerrainCell> = { ...baseTerrain };
	const { width, height } = gridSize;
	const roundsPerRing = Math.max(1, config.hazardEscalationEveryNRounds);

	const maxShrink = Math.max(0, Math.floor((Math.min(width, height) - 4) / 2));
	const shrinkLevel = Math.min(
		Math.max(0, Math.floor((currentRound - 1) / roundsPerRing)),
		maxShrink
	);

	if (shrinkLevel <= 0) {
		return escalatedTerrain;
	}

	const setPit = (x: number, y: number) => {
		const key = `${x},${y}`;
		if (obstacles[key]) return;
		escalatedTerrain[key] = {
			position: { x, y },
			type: 'pit'
		};
	};

	const setConveyor = (x: number, y: number, direction: Rotation) => {
		const key = `${x},${y}`;
		if (obstacles[key]) return;
		escalatedTerrain[key] = {
			position: { x, y },
			type: 'conveyor',
			direction
		};
	};

	for (let level = 1; level <= shrinkLevel; level++) {
		const minX = level;
		const maxX = width - 1 - level;
		const minY = level;
		const maxY = height - 1 - level;

		if (minX >= maxX || minY >= maxY) {
			break;
		}

		for (let x = minX; x <= maxX; x++) {
			setPit(x, minY);
			setPit(x, maxY);
		}

		for (let y = minY; y <= maxY; y++) {
			setPit(minX, y);
			setPit(maxX, y);
		}

		const centerX = Math.floor((minX + maxX) / 2);
		const centerY = Math.floor((minY + maxY) / 2);

		setConveyor(centerX, minY, 180);
		setConveyor(centerX, maxY, 0);
		setConveyor(minX, centerY, 90);
		setConveyor(maxX, centerY, 270);
	}

	return escalatedTerrain;
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

	const mapConfig = resolveArenaMap();
	arenaState.gridSize = { ...mapConfig.gridSize };

	if (playerCount < MIN_ARENA_PLAYERS || playerCount > MAX_ARENA_PLAYERS) {
		arenaState.robots = {};
		return;
	}

	arenaState.mapLayoutId = sanitizeMapLayoutId(arenaState.mapLayoutId);

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
	matchState.eliminatedPlayerRounds = {};

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
			arenaState.mapLayoutId = sanitizeMapLayoutId(layoutId);
		});
	},

	/** Set current player's map vote in lobby */
	async setMapVote(layoutId: MapLayoutId) {
		await kmClient.transact(
			[arenaStore, matchStore],
			([arenaState, matchState]) => {
				if (matchState.phase !== 'lobby') return;
				arenaState.mapVotes[kmClient.id] = sanitizeMapLayoutId(layoutId);
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
					if (matchState.eliminatedPlayerRounds[clientId] === undefined) {
						matchState.eliminatedPlayerRounds[clientId] =
							matchState.currentRound;
					}
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
