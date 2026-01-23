import { kmClient } from '@/services/km-client';
import type { MoveCommand } from '@/types/arena';
import {
	localPlayerStore,
	type LocalPlayerState
} from '../stores/local-player-store';
import { playersStore } from '../stores/players-store';

/**
 * Actions for local player mutations.
 * Handles current player's state changes.
 * Some actions may affect global stores (e.g., player registration).
 *
 * Note: Uses `kmClient.id` to identify current player in global stores.
 */
export const localPlayerActions = {
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
		await kmClient.transact(
			[localPlayerStore, playersStore],
			([localPlayerState, playersState]) => {
				localPlayerState.name = name;
				playersState.players[kmClient.id] = { name };
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
