import { MinimapPreview } from '@/components/minimap-preview';
import { config } from '@/config';
import { resolveArenaMap } from '@/config/arena-maps';
import {
	MAP_LAYOUTS,
	sanitizeMapLayoutId
} from '@/state/actions/arena-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { useSnapshot } from '@kokimoki/app';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Example view demonstrating how to display lobby content before game starts.
 * Modify or replace with your own implementation.
 */
export function GameLobbyView() {
	const { mapLayoutId } = useSnapshot(arenaStore.proxy);

	const previewMap = resolveArenaMap();
	const selectedMapLayoutId = sanitizeMapLayoutId(mapLayoutId);

	return (
		<div className="animate-fade-in-up flex w-full max-w-2xl flex-col gap-6">
			<article className="prose">
				<Markdown remarkPlugins={[remarkGfm]}>{config.gameLobbyMd}</Markdown>
			</article>

			<section className="space-y-3 rounded-sm border-2 border-slate-700 bg-slate-800/40 p-4 backdrop-blur-sm">
				<h3 className="font-display text-neon-cyan text-lg tracking-wide uppercase">
					{config.mapSelectLabel}
				</h3>

				<div className="space-y-2 rounded-sm border border-slate-700 bg-slate-900/40 p-3">
					<p className="font-mono text-xs text-slate-400 uppercase">
						{MAP_LAYOUTS[selectedMapLayoutId].name}
					</p>
					<div className="flex items-center gap-3">
						<MinimapPreview
							layoutId={selectedMapLayoutId}
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
		</div>
	);
}
