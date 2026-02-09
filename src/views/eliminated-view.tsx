import { config } from '@/config';
import { matchStore } from '@/state/stores/match-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { Skull } from 'lucide-react';
import * as React from 'react';

/**
 * Eliminated view shown to players who have been knocked out
 */
export const EliminatedView: React.FC = () => {
	const { currentRound } = useSnapshot(matchStore.proxy);

	return (
		<div className="animate-fade-in-up flex w-full max-w-md flex-col items-center gap-8 text-center">
			{/* Skull icon with glitch effect */}
			<div className={cn('animate-glitch text-neon-rose')}>
				<Skull className="h-24 w-24 drop-shadow-[0_0_15px_currentColor]" />
			</div>

			{/* Main message */}
			<div className="space-y-3">
				<h1 className="font-display text-neon-rose neon-text-glow text-4xl tracking-wider uppercase">
					{config.eliminatedTitle}
				</h1>
				<p className="font-mono text-lg text-slate-400">
					{config.eliminatedMessage}
				</p>
			</div>

			{/* Stats */}
			<div className="flex gap-8">
				<div className="flex flex-col items-center rounded-sm border-2 border-slate-700 bg-slate-800/40 px-8 py-5 backdrop-blur-sm">
					<span className="font-display text-neon-cyan neon-text-glow-sm text-4xl">
						{currentRound}
					</span>
					<span className="font-mono text-sm text-slate-500 uppercase">
						{config.roundsSurvivedLabel}
					</span>
				</div>
			</div>

			{/* Waiting message */}
			<div className="animate-screen-flicker rounded-sm border-2 border-slate-700 bg-slate-800/30 px-6 py-4 backdrop-blur-sm">
				<p className="font-mono text-slate-400">
					{config.eliminatedWaitingMessage}
				</p>
			</div>
		</div>
	);
};
