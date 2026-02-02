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
		<div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
			{/* Skull icon with glitch effect */}
			<div className={cn('animate-glitch text-neon-rose')}>
				<Skull className="h-24 w-24" />
			</div>

			{/* Main message */}
			<div className="space-y-2">
				<h1 className="font-display text-neon-rose neon-text-glow text-4xl tracking-wider uppercase">
					{config.eliminatedTitle}
				</h1>
				<p className="font-mono text-lg text-slate-400">
					{config.eliminatedMessage}
				</p>
			</div>

			{/* Stats */}
			<div className="flex gap-8">
				<div className="flex flex-col items-center border-2 border-slate-600 bg-slate-800/50 px-6 py-4">
					<span className="font-display text-neon-cyan text-3xl">
						{currentRound}
					</span>
					<span className="font-mono text-sm text-slate-400 uppercase">
						{config.roundsSurvivedLabel}
					</span>
				</div>
			</div>

			{/* Waiting message */}
			<div className="border-2 border-slate-600 bg-slate-800/50 px-6 py-4">
				<p className="font-mono text-slate-300">
					{config.eliminatedWaitingMessage}
				</p>
			</div>
		</div>
	);
};
