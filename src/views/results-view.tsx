import { config } from '@/config';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { useKmConfettiContext } from '@kokimoki/shared';
import { Medal, Trophy } from 'lucide-react';
import * as React from 'react';

/**
 * Results view shown after match ends
 */
export const ResultsView: React.FC = () => {
	const { winnerId } = useSnapshot(matchStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);
	const { triggerConfetti, stopConfetti } = useKmConfettiContext();

	const winnerName = winnerId ? players[winnerId]?.name || 'Unknown' : null;

	// Trigger confetti celebration when there's a winner
	React.useEffect(() => {
		if (winnerId) {
			triggerConfetti({ preset: 'massive' });
		}
		return () => {
			stopConfetti();
		};
	}, [winnerId, triggerConfetti, stopConfetti]);

	return (
		<div className="animate-fade-in-up flex w-full max-w-md flex-col items-center gap-8 text-center">
			{/* Trophy icon */}
			<div className={winnerId ? 'text-neon-lime animate-shine' : ''}>
				{winnerId ? (
					<Trophy className="h-24 w-24" />
				) : (
					<Medal className="h-24 w-24 text-slate-400" />
				)}
			</div>

			{/* Winner announcement */}
			<div className="space-y-3">
				{winnerId ? (
					<>
						<h1 className="font-display text-neon-lime neon-text-glow text-4xl tracking-wider uppercase">
							{config.winnerTitle}
						</h1>
						<p className="font-display neon-text-glow-sm text-neon-lime text-2xl tracking-wide uppercase">
							{winnerName}
						</p>
					</>
				) : (
					<>
						<h1 className="font-display text-4xl tracking-wider text-slate-400 uppercase">
							{config.drawTitle}
						</h1>
						<p className="font-mono text-lg text-slate-500">
							{config.drawMessage}
						</p>
					</>
				)}
			</div>

			{/* Match complete message */}
			<div
				className={cn(
					'rounded-sm border-2 px-6 py-4 backdrop-blur-sm',
					winnerId
						? 'border-neon-lime/30 bg-neon-lime/5 shadow-[0_0_20px_var(--color-neon-lime)/0.1]'
						: 'border-slate-700 bg-slate-800/40'
				)}
			>
				<p className="font-mono text-slate-400">
					{config.matchCompleteMessage}
				</p>
			</div>
		</div>
	);
};
