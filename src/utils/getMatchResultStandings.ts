import type { MatchResultReason, RobotState } from '@/types/arena';

export interface MatchResultStanding {
	clientId: string;
	name: string;
	lives: number;
	damage: number;
}

export function isTimeoutResult(
	resultReason: MatchResultReason | null
): boolean {
	return (
		resultReason === 'timeout-lives' ||
		resultReason === 'timeout-damage' ||
		resultReason === 'timeout-draw'
	);
}

export function getMatchResultStandings(
	robots: Record<string, RobotState>,
	damageDealtByPlayer: Record<string, number>
): MatchResultStanding[] {
	return Object.entries(robots)
		.filter(([, robot]) => robot.lives > 0)
		.map(([clientId, robot]) => ({
			clientId,
			name: robot.name,
			lives: robot.lives,
			damage: damageDealtByPlayer[clientId] ?? 0
		}))
		.sort((left, right) => {
			if (right.lives !== left.lives) {
				return right.lives - left.lives;
			}

			if (right.damage !== left.damage) {
				return right.damage - left.damage;
			}

			return left.name.localeCompare(right.name);
		});
}
