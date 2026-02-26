import { kmClient } from '@/services/km-client';
import type { MoveCommand } from '@/types/arena';
import { arenaStore } from '../stores/arena-store';
import {
	localPlayerStore,
	type LocalPlayerState
} from '../stores/local-player-store';
import { matchStore } from '../stores/match-store';
import { playersStore } from '../stores/players-store';
import { robotProgramsStore } from '../stores/robot-programs-store';

/**
 * Actions for local player mutations.
 * Handles current player's state changes.
 * Some actions may affect global stores (e.g., player registration).
 *
 * Note: Uses `kmClient.id` to identify current player in global stores.
 */
export const localPlayerActions = {
	/** Set only local player name without touching shared players registry */
	async setLocalName(name: string) {
		await kmClient.transact([localPlayerStore], ([localPlayerState]) => {
			localPlayerState.name = name;
		});
	},

	/** Change current player's view/navigation state */
	async setCurrentView(view: LocalPlayerState['currentView']) {
		await kmClient.transact([localPlayerStore], ([localPlayerState]) => {
			localPlayerState.currentView = view;
		});
	},

	/**
	 * Set player name - updates both local store and globals players list.
	 *
	 * Note: This is an example of a multi-store transaction.
	 */
	async setPlayerName(name: string) {
		const normalizedName = name.trim().toLowerCase();
		const currentClientId = kmClient.id;
		const onlineClientIds = new Set(playersStore.connections.clientIds);
		const players = playersStore.proxy.players;
		const participantIds = matchStore.proxy.participantIds;

		const reclaimClientId = Object.keys(players).find((clientId) => {
			if (clientId === currentClientId) {
				return false;
			}

			const existingName = players[clientId]?.name?.trim().toLowerCase();
			if (!existingName || existingName !== normalizedName) {
				return false;
			}

			if (!participantIds[clientId]) {
				return false;
			}

			if (participantIds[currentClientId]) {
				return false;
			}

			return !onlineClientIds.has(clientId);
		});

		await kmClient.transact(
			[
				localPlayerStore,
				playersStore,
				arenaStore,
				matchStore,
				robotProgramsStore
			],
			([
				localPlayerState,
				playersState,
				arenaState,
				matchState,
				programsState
			]) => {
				localPlayerState.name = name;

				if (reclaimClientId) {
					const reclaimedPlayer = playersState.players[reclaimClientId] ?? {
						name
					};
					playersState.players[currentClientId] = {
						...reclaimedPlayer,
						name
					};
					delete playersState.players[reclaimClientId];

					if (arenaState.robots[reclaimClientId]) {
						arenaState.robots[currentClientId] =
							arenaState.robots[reclaimClientId];
						delete arenaState.robots[reclaimClientId];
					}

					if (matchState.participantIds[reclaimClientId]) {
						matchState.participantIds[currentClientId] = true;
						delete matchState.participantIds[reclaimClientId];
					}

					if (matchState.submittedPlayers[reclaimClientId]) {
						matchState.submittedPlayers[currentClientId] = true;
						delete matchState.submittedPlayers[reclaimClientId];
					}

					if (matchState.eliminatedPlayers[reclaimClientId]) {
						matchState.eliminatedPlayers[currentClientId] = true;
						delete matchState.eliminatedPlayers[reclaimClientId];
					}

					if (
						matchState.eliminatedPlayerRounds[reclaimClientId] !== undefined
					) {
						matchState.eliminatedPlayerRounds[currentClientId] =
							matchState.eliminatedPlayerRounds[reclaimClientId];
						delete matchState.eliminatedPlayerRounds[reclaimClientId];
					}

					if (programsState.programs[reclaimClientId]) {
						programsState.programs[currentClientId] =
							programsState.programs[reclaimClientId];
						delete programsState.programs[reclaimClientId];
					}
				} else {
					playersState.players[currentClientId] = { name };
				}
			}
		);
	},

	/** Add a command to the draft program */
	async addCommand(command: MoveCommand) {
		await kmClient.transact([localPlayerStore], ([state]) => {
			if (state.draftProgram.length < 5) {
				state.draftProgram.push(command);
			}
		});
	},

	/** Remove a command at index from draft program */
	async removeCommand(index: number) {
		await kmClient.transact([localPlayerStore], ([state]) => {
			if (index >= 0 && index < state.draftProgram.length) {
				state.draftProgram.splice(index, 1);
			}
		});
	},

	/** Clear the draft program */
	async clearProgram() {
		await kmClient.transact([localPlayerStore], ([state]) => {
			state.draftProgram = [];
		});
	},

	/** Set the draft program directly */
	async setDraftProgram(program: MoveCommand[]) {
		await kmClient.transact([localPlayerStore], ([state]) => {
			state.draftProgram = program.slice(0, 5);
		});
	},

	/** Mark as submitted */
	async setSubmitted(submitted: boolean) {
		await kmClient.transact([localPlayerStore], ([state]) => {
			state.hasSubmitted = submitted;
		});
	},

	/** Reset for new round */
	async resetForNewRound() {
		await kmClient.transact([localPlayerStore], ([state]) => {
			state.draftProgram = [];
			state.hasSubmitted = false;
		});
	}
};
