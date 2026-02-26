import type { ArenaMapConfig } from '@/types/arena';

export const MIN_ARENA_PLAYERS = 2;
export const MAX_ARENA_PLAYERS = 10;

/** Fixed arena configuration (14×14). */
export const FIXED_ARENA_MAP: ArenaMapConfig = {
	id: 'fixed',
	minPlayers: MIN_ARENA_PLAYERS,
	maxPlayers: MAX_ARENA_PLAYERS,
	gridSize: { width: 14, height: 14 },
	obstacleDensity: 0.12
};

/**
 * Resolve map configuration.
 * Arena size is fixed to 14x14.
 */
export function resolveArenaMap(): ArenaMapConfig {
	return FIXED_ARENA_MAP;
}
