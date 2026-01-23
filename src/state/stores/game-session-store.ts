import { kmClient } from '@/services/km-client';

export interface GameSessionState {
	started: boolean;
	startTimestamp: number;
	/** Connection ID of the current global controller */
	controllerConnectionId: string;
}

const initialState: GameSessionState = {
	started: false,
	startTimestamp: 0,
	controllerConnectionId: ''
};

/**
 * Domain: Game Session
 *
 * Global store for current game session state - the live status of the ongoing game.
 *
 * Synced across all clients.
 *
 * Use this store for:
 * - Game lifecycle (started, ended)
 * - Current game state (round/phase)
 * - Active timers
 * - Global controller assignment
 * - Any dynamic data that reflects the game progress and needs to be synced globally
 *
 * @see gameSessionActions for state mutations
 */
export const gameSessionStore = kmClient.store<GameSessionState>(
	'game-session',
	initialState
);
