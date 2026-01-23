import { config } from '@/config';
import Markdown from 'react-markdown';

/**
 * Example view demonstrating how to display lobby content before game starts.
 * Modify or replace with your own implementation.
 */
export function GameLobbyView() {
	return (
		<article className="prose">
			<Markdown>{config.gameLobbyMd}</Markdown>
		</article>
	);
}
