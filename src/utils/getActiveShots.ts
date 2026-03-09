import type { ExecutionEvent, Position, Rotation } from '@/types/arena';

export interface ActiveShot {
	from: Position;
	direction: Rotation;
	shooterId: string;
}

export function getActiveShotsForTick(
	executionEvents: Record<string, ExecutionEvent>,
	currentTick: number
): ActiveShot[] {
	if (currentTick < 0) {
		return [];
	}

	return Object.values(executionEvents)
		.filter((event) => {
			return (
				event.type === 'shoot' &&
				event.tick === currentTick &&
				Boolean(event.data?.from) &&
				typeof event.data?.rotation === 'number'
			);
		})
		.map((event) => ({
			from: event.data?.from as Position,
			direction: event.data?.rotation as Rotation,
			shooterId: event.clientId
		}));
}
