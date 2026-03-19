import { config } from '@/config';
import type { MatchResultReason } from '@/types/arena';

export function getMatchResultCopy(
	resultReason: MatchResultReason | null
): string | null {
	switch (resultReason) {
		case 'simultaneous-draw':
			return config.drawMessage;
		case 'timeout-lives':
			return `${config.timeoutRoundLimitMessage} ${config.timeoutLivesWinMessage}`;
		case 'timeout-damage':
			return `${config.timeoutRoundLimitMessage} ${config.timeoutDamageWinMessage}`;
		case 'timeout-draw':
			return config.timeoutDrawMessage;
		default:
			return null;
	}
}
