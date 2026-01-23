import { kmClient } from '@/services/km-client';

export interface LocalPlayerState {
	/** Player's display name (also registered in playersStore) */
	name: string;
	currentView: 'lobby' | 'game-state';
}

const initialState: LocalPlayerState = {
	name: '',
	currentView: 'lobby'
};

/**
 * Domain: Local Player
 *
 * Local store for current player's device state - NOT synced with other clients.
 *
 * Use this store for:
 * - Player's own profile data
 * - Current player UI view/navigation state
 * - Player preferences
 * - Any local data that shouldn't be synced globally with other players
 *
 * Note: Uses `kmClient.localStore` for local-only storage.
 *
 * @see localPlayerActions for state mutations
 */
export const localPlayerStore = kmClient.localStore<LocalPlayerState>(
	'local-player',
	initialState
);
