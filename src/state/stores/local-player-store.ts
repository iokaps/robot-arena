import { kmClient } from '@/services/km-client';
import type { MoveCommand } from '@/types/arena';

export interface LocalPlayerState {
	/** Player's display name (also registered in playersStore) */
	name: string;
	/** Current view for player navigation */
	currentView:
		| 'lobby'
		| 'programming'
		| 'spectating'
		| 'eliminated'
		| 'results';
	/** Draft program being edited (before submission) */
	draftProgram: MoveCommand[];
	/** Whether the player has submitted their program this round */
	hasSubmitted: boolean;
}

const initialState: LocalPlayerState = {
	name: '',
	currentView: 'lobby',
	draftProgram: [],
	hasSubmitted: false
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
