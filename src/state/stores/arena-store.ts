import { kmClient } from '@/services/km-client';
import type {
	ArenaSizeId,
	MapLayoutId,
	Position,
	RobotState,
	TerrainCell
} from '@/types/arena';

export interface ArenaState {
	/** Grid dimensions */
	gridSize: { width: number; height: number };
	/** Robots on the arena, keyed by clientId */
	robots: Record<string, RobotState>;
	/** Obstacle positions (walls), keyed by "x,y" string */
	obstacles: Record<string, Position>;
	/** Terrain cells (pits, conveyors), keyed by "x,y" string */
	terrain: Record<string, TerrainCell>;
	/** Current map layout ID (obstacle pattern) */
	mapLayoutId: MapLayoutId;
	/** Selected arena size ID ('auto' for player-count based) */
	selectedSizeId: ArenaSizeId;
}

const initialState: ArenaState = {
	gridSize: { width: 10, height: 10 },
	robots: {},
	obstacles: {},
	terrain: {},
	mapLayoutId: 'open',
	selectedSizeId: 'auto'
};

/**
 * Domain: Arena
 *
 * Global store for the battle arena state - grid, robots, obstacles.
 * Synced across all clients.
 *
 * Use this store for:
 * - Robot positions, rotations, and lives
 * - Obstacle layout
 * - Grid configuration
 *
 * @see arenaActions for state mutations
 */
export const arenaStore = kmClient.store<ArenaState>('arena', initialState);
