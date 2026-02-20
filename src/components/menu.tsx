import { config } from '@/config';
import { useKmModal } from '@kokimoki/shared';
import { HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Example component demonstrating how to create a player menu with help drawer.
 * Modify or replace with your own implementation.
 */
export function PlayerMenu() {
	const { openDrawer } = useKmModal();

	const handleOpenHelp = () => {
		openDrawer({
			content: (
				<div className="max-h-full w-full overflow-y-auto bg-slate-900">
					<div className="container mx-auto px-4 py-16">
						<article className="prose prose-invert prose-slate max-w-none">
							<Markdown remarkPlugins={[remarkGfm]}>
								{config.menuHelpMd}
							</Markdown>
						</article>
					</div>
				</div>
			)
		});
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={handleOpenHelp}
				className="flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-slate-900 hover:text-slate-50"
			>
				<HelpCircle className="size-5" />
				<span className="sr-only">{config.menuHelpAriaLabel}</span>
			</button>
		</div>
	);
}
