import { kmClient } from '@/services/km-client';
import type { MapLayoutId, Position, RobotState } from '@/types/arena';

export interface ArenaState {
	/** Grid dimensions */
	gridSize: { width: number; height: number };
	/** Robots on the arena, keyed by clientId */
	robots: Record<string, RobotState>;
	/** Obstacle positions, keyed by "x,y" string */
	obstacles: Record<string, Position>;
	/** Current map layout ID */
	mapLayoutId: MapLayoutId;
}

const initialState: ArenaState = {
	gridSize: { width: 10, height: 10 },
	robots: {},
	obstacles: {},
	mapLayoutId: 'open'
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
