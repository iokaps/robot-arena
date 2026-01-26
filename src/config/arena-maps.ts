import type { ArenaMapConfig, ArenaSizeId } from '@/types/arena';

/**
 * Arena map configurations that scale with player count.
 * Each map size is designed to provide adequate space for the specified player range.
 */
export const ARENA_MAPS: ArenaMapConfig[] = [
	{
		id: 'small',
		minPlayers: 2,
		maxPlayers: 4,
		gridSize: { width: 10, height: 10 },
		obstacleDensity: 0.1
	},
	{
		id: 'medium',
		minPlayers: 5,
		maxPlayers: 8,
		gridSize: { width: 14, height: 14 },
		obstacleDensity: 0.12
	},
	{
		id: 'large',
		minPlayers: 9,
		maxPlayers: 12,
		gridSize: { width: 18, height: 18 },
		obstacleDensity: 0.12
	},
	{
		id: 'mega',
		minPlayers: 13,
		maxPlayers: 20,
		gridSize: { width: 22, height: 22 },
		obstacleDensity: 0.15
	}
];

/**
 * Get the appropriate arena map configuration based on player count.
 * Returns the smallest map that fits the given player count.
 */
export function getArenaMapForPlayerCount(playerCount: number): ArenaMapConfig {
	const map = ARENA_MAPS.find(
		(m) => playerCount >= m.minPlayers && playerCount <= m.maxPlayers
	);

	// Fallback to largest map if player count exceeds all configs
	return map || ARENA_MAPS[ARENA_MAPS.length - 1];
}

/**
 * Get a specific arena map by ID.
 */
export function getArenaMapById(id: ArenaSizeId): ArenaMapConfig | undefined {
	if (id === 'auto') return undefined;
	return ARENA_MAPS.find((m) => m.id === id);
}

/**
 * Get map configuration - either by explicit ID or auto-select based on player count.
 */
export function resolveArenaMap(
	selectedSizeId: ArenaSizeId,
	playerCount: number
): ArenaMapConfig {
	if (selectedSizeId === 'auto') {
		return getArenaMapForPlayerCount(playerCount);
	}
	return (
		getArenaMapById(selectedSizeId) || getArenaMapForPlayerCount(playerCount)
	);
}
