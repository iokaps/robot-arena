import { kmClient } from '@/services/km-client';
import type { MoveCommand } from '@/types/arena';
import { arenaStore } from '../stores/arena-store';
import { matchStore } from '../stores/match-store';
import { robotProgramsStore } from '../stores/robot-programs-store';
import { arenaActions } from './arena-actions';

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
				if (participantIds.length < 2) {
					return;
				}

				matchState.participantIds = {};
				for (const clientId of participantIds) {
					matchState.participantIds[clientId] = true;
				}

				matchState.phase = 'programming';
				matchState.currentRound = 1;
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.submittedPlayers = {};
				matchState.eliminatedPlayers = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				matchState.winnerId = '';
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

				// Pad program to 5 moves with 'wait' if needed
				const paddedProgram = [...program];
				while (paddedProgram.length < 5) {
					paddedProgram.push('wait');
				}

				programsState.programs[clientId] = paddedProgram.slice(0, 5);
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
					if (!programsState.programs[clientId]) {
						programsState.programs[clientId] = [
							'wait',
							'wait',
							'wait',
							'wait',
							'wait'
						];
						matchState.submittedPlayers[clientId] = true;
					}
				}

				matchState.phase = 'executing';
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.currentTick = 0;
				matchState.executionEvents = {};
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
		});
	},

	/** Start a rematch from results using the locked roster and current arena settings */
	async startRematch() {
		const participantIds = Object.keys(matchStore.proxy.participantIds);
		if (participantIds.length < 2) {
			return;
		}

		await arenaActions.spawnRobotsForPlayerIds(participantIds);

		await kmClient.transact(
			[matchStore, robotProgramsStore, arenaStore],
			([matchState, programsState, arenaState]) => {
				const spawnedParticipantIds = Object.keys(arenaState.robots);
				if (spawnedParticipantIds.length < 2) {
					return;
				}

				matchState.participantIds = {};
				for (const clientId of spawnedParticipantIds) {
					matchState.participantIds[clientId] = true;
				}

				matchState.phase = 'programming';
				matchState.currentRound = 1;
				matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				matchState.submittedPlayers = {};
				matchState.eliminatedPlayers = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				matchState.winnerId = '';
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
				matchState.phaseStartTimestamp = 0;
				matchState.submittedPlayers = {};
				matchState.eliminatedPlayers = {};
				matchState.currentTick = -1;
				matchState.executionEvents = {};
				matchState.winnerId = '';
				programsState.programs = {};
				arenaState.robots = {};
			}
		);
	}
};
