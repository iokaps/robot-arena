import { config } from '@/config';
import { localPlayerActions } from '@/state/actions/local-player-actions';
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

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const trimmedName = name.trim();
		if (!trimmedName) return;

		setIsLoading(true);
		try {
			await localPlayerActions.setPlayerName(trimmedName);
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
			<form onSubmit={handleSubmit} className="grid gap-5">
				<div className="relative">
					<input
						type="text"
						placeholder={config.playerNamePlaceholder}
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={isLoading}
						autoFocus
						maxLength={50}
						className="km-input"
					/>
					{name.trim() && (
						<div className="bg-neon-cyan absolute top-1/2 right-4 h-2 w-2 -translate-y-1/2 rounded-full shadow-[0_0_6px_var(--color-neon-cyan)]" />
					)}
				</div>

				<button
					type="submit"
					className="km-btn-primary w-full"
					disabled={!name.trim() || isLoading}
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
