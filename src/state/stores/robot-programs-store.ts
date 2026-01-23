import { kmClient } from '@/services/km-client';
import type { MoveCommand } from '@/types/arena';

export interface RobotProgramsState {
	/** Submitted programs, keyed by clientId */
	programs: Record<string, MoveCommand[]>;
}

const initialState: RobotProgramsState = {
	programs: {}
};

/**
 * Domain: Robot Programs
 *
 * Global store for submitted robot programs.
 * Programs are only populated after programming phase ends.
 * Synced across all clients.
 *
 * Use this store for:
 * - Storing submitted move sequences
 * - Reading programs during execution phase
 *
 * @see matchActions.submitProgram for submission
 */
export const robotProgramsStore = kmClient.store<RobotProgramsState>(
	'robot-programs',
	initialState
);
