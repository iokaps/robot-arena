import { MinimapPreview } from '@/components/minimap-preview';
import { config } from '@/config';
import { resolveArenaMap } from '@/config/arena-maps';
import { kmClient } from '@/services/km-client';
import {
	MAP_LAYOUTS,
	arenaActions,
	sanitizeMapLayoutId
} from '@/state/actions/arena-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { matchStore } from '@/state/stores/match-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Example view demonstrating how to display lobby content before game starts.
 * Modify or replace with your own implementation.
 */
export function GameLobbyView() {
	const { mapVotes, mapLayoutId } = useSnapshot(arenaStore.proxy);
	const { phase } = useSnapshot(matchStore.proxy);

	const previewMap = resolveArenaMap();

	const myVote = mapVotes[kmClient.id];
	const selectedMapLayoutId = sanitizeMapLayoutId(mapLayoutId);
	const previewLayoutId = sanitizeMapLayoutId(myVote ?? selectedMapLayoutId);
	const voteEntries = Object.values(MAP_LAYOUTS);

	return (
		<div className="animate-fade-in-up flex w-full max-w-2xl flex-col gap-6">
			<article className="prose">
				<Markdown remarkPlugins={[remarkGfm]}>{config.gameLobbyMd}</Markdown>
			</article>

			{phase === 'lobby' && (
				<section className="space-y-3 rounded-sm border-2 border-slate-700 bg-slate-800/40 p-4 backdrop-blur-sm">
					<div className="space-y-1">
						<h3 className="font-display text-neon-cyan text-lg tracking-wide uppercase">
							{config.mapVotingTitle}
						</h3>
						<p className="font-mono text-sm text-slate-400">
							{config.mapVotingDescription}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{voteEntries.map((layout) => (
							<button
								key={layout.id}
								type="button"
								onClick={() => arenaActions.setMapVote(layout.id)}
								className={cn(
									'border-2 px-3 py-2 text-left font-mono text-sm transition-all',
									sanitizeMapLayoutId(myVote) === layout.id && Boolean(myVote)
										? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan'
										: selectedMapLayoutId === layout.id
											? 'border-neon-lime/60 bg-neon-lime/10 text-neon-lime'
											: 'hover:border-neon-cyan/40 border-slate-700 bg-slate-800/60 text-slate-300'
								)}
							>
								<span className="uppercase">{layout.name}</span>
							</button>
						))}
					</div>

					<div className="space-y-2 rounded-sm border border-slate-700 bg-slate-900/40 p-3">
						<p className="font-mono text-xs text-slate-400 uppercase">
							{config.mapSelectLabel}: {MAP_LAYOUTS[previewLayoutId].name}
						</p>
						<div className="flex items-center gap-3">
							<MinimapPreview
								layoutId={previewLayoutId}
								gridSize={previewMap.gridSize}
								cellSize={8}
								maxWidth={160}
							/>
							<span className="font-mono text-xs text-slate-500">
								{previewMap.gridSize.width}×{previewMap.gridSize.height}
							</span>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
