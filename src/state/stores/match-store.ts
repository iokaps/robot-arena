import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import type {
	ExecutionEvent,
	GamePhase,
	MatchResultReason
} from '@/types/arena';

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
	/** Round number when each player was eliminated */
	eliminatedPlayerRounds: Record<string, number>;
	/** Current execution tick (0-4 for 5 moves) */
	currentTick: number;
	/** Execution events for animation playback */
	executionEvents: Record<string, ExecutionEvent>;
	/** Total life damage dealt by each player during the current match */
	damageDealtByPlayer: Record<string, number>;
	/** Winner client ID (empty if no winner yet) */
	winnerId: string;
	/** Why the match ended */
	resultReason: MatchResultReason | null;
}

const initialState: MatchState = {
	phase: 'lobby',
	participantIds: {},
	currentRound: 0,
	maxRounds: config.maxRounds,
	phaseStartTimestamp: 0,
	programmingDuration: 60,
	submittedPlayers: {},
	eliminatedPlayers: {},
	eliminatedPlayerRounds: {},
	currentTick: -1,
	executionEvents: {},
	damageDealtByPlayer: {},
	winnerId: '',
	resultReason: null
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
