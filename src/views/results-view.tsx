import { config } from '@/config';
import { matchStore } from '@/state/stores/match-store';
import { playersStore } from '@/state/stores/players-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { Medal, Trophy } from 'lucide-react';
import * as React from 'react';

/**
 * Results view shown after match ends
 */
export const ResultsView: React.FC = () => {
	const { winnerId } = useSnapshot(matchStore.proxy);
	const { players } = useSnapshot(playersStore.proxy);

	const winnerName = winnerId ? players[winnerId]?.name || 'Unknown' : null;

	return (
		<div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
			{/* Trophy icon */}
			<div className="text-neon-lime">
				{winnerId ? (
					<Trophy className="h-24 w-24" />
				) : (
					<Medal className="h-24 w-24 text-slate-400" />
				)}
			</div>

			{/* Winner announcement */}
			<div className="space-y-2">
				{winnerId ? (
					<>
						<h1 className="font-display text-neon-lime neon-text-glow text-4xl tracking-wider uppercase">
							{config.winnerTitle}
						</h1>
						<p className="font-display text-2xl tracking-wide text-slate-100 uppercase">
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
					'border-2 px-6 py-4',
					winnerId
						? 'border-neon-lime/40 bg-neon-lime/10'
						: 'border-slate-600 bg-slate-800/50'
				)}
			>
				<p className="font-mono text-slate-300">
					{config.matchCompleteMessage}
				</p>
			</div>
		</div>
	);
};
