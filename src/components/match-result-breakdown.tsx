import { config } from '@/config';
import { cn } from '@/utils/cn';
import type { MatchResultStanding } from '@/utils/getMatchResultStandings';
import * as React from 'react';

interface MatchResultBreakdownProps {
	standings: MatchResultStanding[];
	winnerId: string;
	className?: string;
}

export const MatchResultBreakdown: React.FC<MatchResultBreakdownProps> = ({
	standings,
	winnerId,
	className
}) => {
	if (standings.length === 0) {
		return null;
	}

	const leadLives = standings[0]?.lives ?? 0;
	const leadDamage = standings[0]?.damage ?? 0;

	return (
		<div
			className={cn(
				'rounded-sm border border-slate-700 bg-slate-950/70 p-4 backdrop-blur-sm',
				className
			)}
		>
			<p className="font-display text-sm tracking-wide text-slate-200 uppercase">
				{config.finalStandingsTitle}
			</p>
			<div className="mt-3 space-y-2">
				<div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 font-mono text-[11px] tracking-wide text-slate-500 uppercase">
					<span>{config.robotStatusLabel}</span>
					<span>{config.livesLabel}</span>
					<span>{config.damageLabel}</span>
				</div>
				{standings.map((standing, index) => {
					const isWinner = winnerId === standing.clientId;
					const isTiedLeader =
						!winnerId &&
						standing.lives === leadLives &&
						standing.damage === leadDamage;

					return (
						<div
							key={standing.clientId}
							className={cn(
								'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-sm border px-3 py-2',
								isWinner
									? 'border-neon-lime/40 bg-neon-lime/10 text-neon-lime'
									: isTiedLeader
										? 'border-slate-500 bg-slate-800/70 text-slate-100'
										: 'border-slate-800 bg-slate-900/70 text-slate-300'
							)}
						>
							<div className="flex min-w-0 items-center gap-2">
								<span className="font-mono text-xs text-slate-500">
									#{index + 1}
								</span>
								<span className="font-display truncate text-sm tracking-wide uppercase">
									{standing.name}
								</span>
							</div>
							<span className="font-mono text-sm">{standing.lives}</span>
							<span className="font-mono text-sm">{standing.damage}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
