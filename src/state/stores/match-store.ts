import { kmClient } from '@/services/km-client';
import type { ExecutionEvent, GamePhase } from '@/types/arena';

export interface MatchState {
	/** Current game phase */
	phase: GamePhase;
	/** Locked participant roster for the current/last match */
	participantIds: Record<string, boolean>;
	/** Current round number (1-based) */
	currentRound: number;
	/** Maximum rounds before timeout */
	maxRounds: number;
	/** Timestamp when current phase started */
	phaseStartTimestamp: number;
	/** Programming phase duration in seconds */
	programmingDuration: number;
	/** Players who have submitted their program this round */
	submittedPlayers: Record<string, boolean>;
	/** Players who have been eliminated */
	eliminatedPlayers: Record<string, boolean>;
	/** Current execution tick (0-4 for 5 moves) */
	currentTick: number;
	/** Execution events for animation playback */
	executionEvents: Record<string, ExecutionEvent>;
	/** Winner client ID (empty if no winner yet) */
	winnerId: string;
}

const initialState: MatchState = {
	phase: 'lobby',
	participantIds: {},
	currentRound: 0,
	maxRounds: 10,
	phaseStartTimestamp: 0,
	programmingDuration: 60,
	submittedPlayers: {},
	eliminatedPlayers: {},
	currentTick: -1,
	executionEvents: {},
	winnerId: ''
};

/**
 * Domain: Match
 *
 * Global store for match lifecycle state - phases, rounds, timing.
 * Synced across all clients.
 *
 * Use this store for:
 * - Game phase (lobby, programming, executing, results)
 * - Round tracking
 * - Phase timestamps for countdowns
 * - Submission and elimination tracking
 *
 * @see matchActions for state mutations
 */
export const matchStore = kmClient.store<MatchState>('match', initialState);
