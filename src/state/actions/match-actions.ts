import { config } from '@/config';
import { MAX_ARENA_PLAYERS, MIN_ARENA_PLAYERS } from '@/config/arena-maps';
import { kmClient } from '@/services/km-client';
import type { MoveCommand } from '@/types/arena';
import { arenaStore } from '../stores/arena-store';
import { matchStore } from '../stores/match-store';
import { robotProgramsStore } from '../stores/robot-programs-store';
import { arenaActions } from './arena-actions';

const VALID_MOVE_COMMANDS: readonly MoveCommand[] = [
	'move-forward',
	'rotate-left',
	'rotate-right',
	'shoot',
	'wait'
];

function isMoveCommand(value: unknown): value is MoveCommand {
	return (
		typeof value === 'string' &&
		VALID_MOVE_COMMANDS.includes(value as MoveCommand)
	);
}

function normalizeProgram(
	program: readonly unknown[] | undefined
): MoveCommand[] {
	const normalized: MoveCommand[] = [];

	for (const command of program ?? []) {
		if (!isMoveCommand(command)) {
			continue;
		}

		normalized.push(command);
		if (normalized.length >= 5) {
			break;
		}
	}

	while (normalized.length < 5) {
		normalized.push('wait');
	}

	return normalized;
}

/**
 * Actions for match lifecycle mutations
 */
export const matchActions = {
	/** Start a new match from lobby */
	async startMatch() {
		// First spawn robots
		await arenaActions.spawnRobots();

		// Then start programming phase
		await kmClient.transact(
			[matchStore, robotProgramsStore, arenaStore],
			([matchState, programsState, arenaState]) => {
				const participantIds = Object.keys(arenaState.robots);
				if (
					participantIds.length < MIN_ARENA_PLAYERS ||
					participantIds.length > MAX_ARENA_PLAYERS
				) {
					return;
				}

				matchState.participantIds = {};
				for (const clientId of participantIds) {
					matchState.participantIds[clientId] = true;
				}

				matchState.phase = 'programming';
				matchState.currentRound = 1;
				matchState.maxRounds = config.maxRounds;
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.submittedPlayers = {};
				matchState.eliminatedPlayers = {};
				matchState.eliminatedPlayerRounds = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				matchState.damageDealtByPlayer = {};
				matchState.winnerId = '';
				matchState.resultReason = null;
				programsState.programs = {};
			}
		);
	},

	/** Submit a player's program for this round */
	async submitProgram(program: MoveCommand[]) {
		const clientId = kmClient.id;

		await kmClient.transact(
			[matchStore, robotProgramsStore, arenaStore],
			([matchState, programsState, arenaState]) => {
				if (matchState.phase !== 'programming') return;
				if (!matchState.participantIds[clientId]) return;
				if (
					!arenaState.robots[clientId] ||
					arenaState.robots[clientId].lives <= 0
				)
					return;
				if (matchState.submittedPlayers[clientId]) return;

				programsState.programs[clientId] = normalizeProgram(program);
				matchState.submittedPlayers[clientId] = true;
			}
		);
	},

	/** Transition to execution phase (called by global controller) */
	async startExecution() {
		await kmClient.transact(
			[matchStore, robotProgramsStore, arenaStore],
			([matchState, programsState, arenaState]) => {
				if (matchState.phase !== 'programming') return;

				// Auto-submit 'wait' for players who didn't submit
				const activeRobots = Object.keys(arenaState.robots);
				for (const clientId of activeRobots) {
					programsState.programs[clientId] = normalizeProgram(
						programsState.programs[clientId]
					);
					matchState.submittedPlayers[clientId] = true;
				}

				matchState.phase = 'executing';
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.currentTick = 0;
				matchState.executionEvents = {};
				matchState.resultReason = null;
			}
		);
	},

	/** Advance to next execution tick (called by global controller) */
	async advanceTick() {
		await kmClient.transact([matchStore], ([matchState]) => {
			if (matchState.phase !== 'executing') return;
			matchState.currentTick += 1;
		});
	},

	/** Set current tick (called by global controller) */
	async setTick(tick: number) {
		await kmClient.transact([matchStore], ([matchState]) => {
			matchState.currentTick = tick;
		});
	},

	/** Add execution event for animation */
	async addExecutionEvent(event: import('@/types/arena').ExecutionEvent) {
		await kmClient.transact([matchStore], ([matchState]) => {
			const timestamp = kmClient.serverTimestamp();
			matchState.executionEvents[timestamp.toString()] = event;
		});
	},

	/** Start next round of programming */
	async startNextRound() {
		await kmClient.transact(
			[matchStore, robotProgramsStore],
			([matchState, programsState]) => {
				matchState.phase = 'programming';
				matchState.currentRound += 1;
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.submittedPlayers = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				programsState.programs = {};
			}
		);
	},

	/** End match with results */
	async endMatch(winnerId: string) {
		await kmClient.transact([matchStore], ([matchState]) => {
			matchState.phase = 'results';
			matchState.phaseStartTimestamp = kmClient.serverTimestamp();
			matchState.winnerId = winnerId;
			matchState.resultReason = winnerId
				? 'last-standing'
				: 'simultaneous-draw';
		});
	},

	/** Start a rematch from results using the locked roster and current arena settings */
	async startRematch() {
		const participantIds = Object.keys(matchStore.proxy.participantIds);
		if (
			participantIds.length < MIN_ARENA_PLAYERS ||
			participantIds.length > MAX_ARENA_PLAYERS
		) {
			return;
		}

		await arenaActions.spawnRobotsForPlayerIds(participantIds);

		await kmClient.transact(
			[matchStore, robotProgramsStore, arenaStore],
			([matchState, programsState, arenaState]) => {
				const spawnedParticipantIds = Object.keys(arenaState.robots);
				if (
					spawnedParticipantIds.length < MIN_ARENA_PLAYERS ||
					spawnedParticipantIds.length > MAX_ARENA_PLAYERS
				) {
					return;
				}

				matchState.participantIds = {};
				for (const clientId of spawnedParticipantIds) {
					matchState.participantIds[clientId] = true;
				}

				matchState.phase = 'programming';
				matchState.currentRound = 1;
				matchState.maxRounds = config.maxRounds;
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.submittedPlayers = {};
				matchState.eliminatedPlayers = {};
				matchState.eliminatedPlayerRounds = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				matchState.damageDealtByPlayer = {};
				matchState.winnerId = '';
				matchState.resultReason = null;
				programsState.programs = {};
			}
		);
	},

	/** Reset match to lobby state */
	async resetMatch() {
		await kmClient.transact(
			[matchStore, robotProgramsStore, arenaStore],
			([matchState, programsState, arenaState]) => {
				matchState.phase = 'lobby';
				matchState.participantIds = {};
				matchState.currentRound = 0;
				matchState.maxRounds = config.maxRounds;
				matchState.phaseStartTimestamp = 0;
				matchState.submittedPlayers = {};
				matchState.eliminatedPlayers = {};
				matchState.eliminatedPlayerRounds = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				matchState.damageDealtByPlayer = {};
				matchState.winnerId = '';
				matchState.resultReason = null;
				programsState.programs = {};
				arenaState.robots = {};
			}
		);
	}
};
