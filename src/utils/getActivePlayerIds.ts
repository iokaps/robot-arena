export function getActivePlayerIds<TPlayer>(
	players: Record<string, TPlayer>,
	connectedClientIds: Iterable<string>
): string[] {
	const connectedIds =
		connectedClientIds instanceof Set
			? connectedClientIds
			: new Set(connectedClientIds);

	return Object.keys(players).filter((clientId) => connectedIds.has(clientId));
}

export function getActivePlayers<TPlayer>(
	players: Record<string, TPlayer>,
	connectedClientIds: Iterable<string>
): Array<{ id: string; player: TPlayer }> {
	return getActivePlayerIds(players, connectedClientIds).map((id) => ({
		id,
		player: players[id]
	}));
}
