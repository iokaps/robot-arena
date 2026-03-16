import { config } from '@/config';
import { MAX_ARENA_PLAYERS } from '@/config/arena-maps';
import { useStoreConnections } from '@/hooks/useStoreConnections';
import { kmClient } from '@/services/km-client';
import { localPlayerActions } from '@/state/actions/local-player-actions';
import { playersStore } from '@/state/stores/players-store';
import { getActivePlayerIds } from '@/utils/getActivePlayerIds';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Example view demonstrating how to create a player profile form.
 * Shows usage of local player actions for registration.
 * Modify or replace with your own implementation.
 */
export function CreateProfileView() {
	const [name, setName] = React.useState('');
	const [isLoading, setIsLoading] = React.useState(false);
	const [joinError, setJoinError] = React.useState<string | null>(null);
	const { players } = useSnapshot(playersStore.proxy);
	const { clientIds: onlinePlayerIds } = useStoreConnections(playersStore);
	const activePlayerIds = getActivePlayerIds(players, onlinePlayerIds);
	const isCurrentPlayerRegistered = Boolean(players[kmClient.id]);
	const isLobbyFull =
		!isCurrentPlayerRegistered && activePlayerIds.length >= MAX_ARENA_PLAYERS;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const trimmedName = name.trim();
		if (!trimmedName || isLobbyFull) {
			setJoinError(isLobbyFull ? config.maxPlayersMessage : null);
			return;
		}

		setIsLoading(true);
		setJoinError(null);
		try {
			const result = await localPlayerActions.setPlayerName(trimmedName);
			if (result === 'full') {
				setJoinError(config.maxPlayersMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="animate-fade-in-up mx-auto w-full max-w-96 space-y-12">
			<article className="prose text-center">
				<Markdown remarkPlugins={[remarkGfm]}>
					{config.createProfileMd}
				</Markdown>
			</article>
			<p className="text-center font-mono text-xs text-slate-500">
				{config.rejoinHintMessage}
			</p>
			{(isLobbyFull || joinError) && (
				<p className="text-neon-rose text-center font-mono text-sm">
					{joinError ?? config.maxPlayersMessage}
				</p>
			)}
			<form onSubmit={handleSubmit} className="grid gap-5">
				<div className="relative">
					<input
						type="text"
						placeholder={config.playerNamePlaceholder}
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							if (joinError) {
								setJoinError(null);
							}
						}}
						disabled={isLoading || isLobbyFull}
						autoFocus
						maxLength={config.playerNameMaxLength}
						className="km-input"
					/>
					{name.trim() && (
						<div className="bg-neon-cyan absolute top-1/2 right-4 h-2 w-2 -translate-y-1/2 rounded-full shadow-[0_0_6px_var(--color-neon-cyan)]" />
					)}
				</div>

				<button
					type="submit"
					className="km-btn-primary w-full"
					disabled={!name.trim() || isLoading || isLobbyFull}
				>
					{isLoading ? (
						<>
							<span className="border-neon-cyan mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
							{config.loading}
						</>
					) : (
						config.playerNameButton
					)}
				</button>
			</form>
		</div>
	);
}
