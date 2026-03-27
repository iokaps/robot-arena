import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import {
	applyHazardEscalation,
	generatePickups
} from '@/state/actions/arena-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { gameSessionStore } from '@/state/stores/game-session-store';
import { matchStore } from '@/state/stores/match-store';
import { robotProgramsStore } from '@/state/stores/robot-programs-store';
import type {
	ExecutionEvent,
	MatchResultReason,
	MoveCommand,
	Position,
	Rotation
} from '@/types/arena';
import { useSnapshot } from '@kokimoki/app';
import { useEffect, useRef } from 'react';
import { useServerTimer } from './useServerTime';
import { useStoreConnections } from './useStoreConnections';

const VALID_MOVE_COMMANDS: readonly MoveCommand[] = [
	'move-forward',
	'rotate-left',
	'rotate-right',
	'shoot',
	'wait'
];

function isMoveCommand(value: unknown): value is MoveCommand {
	return (
		typeof value === 'string' &&
		VALID_MOVE_COMMANDS.includes(value as MoveCommand)
	);
}

function normalizeProgram(
	program: readonly unknown[] | undefined
): MoveCommand[] {
	const normalized: MoveCommand[] = [];

	for (const command of program ?? []) {
		if (!isMoveCommand(command)) {
			continue;
		}

		normalized.push(command);
		if (normalized.length >= 5) {
			break;
		}
	}

	while (normalized.length < 5) {
		normalized.push('wait');
	}

	return normalized;
}

function getCommandAtTick(
	program: readonly unknown[] | undefined,
	tick: number
): MoveCommand {
	const command = program?.[tick];
	return isMoveCommand(command) ? command : 'wait';
}

/**
 * Hook that maintains a single global controller connection across all clients.
 *
 * Use this hook for logic that should only run on ONE device at a time to avoid
 * duplicate operations and race conditions. Examples:
 * - Time-based events (round timers, game end detection)
 * - Assigning player roles
 * - Running physics simulations
 * - Any operation that modifies global state based on conditions
 *
 * How it works:
 * - One client is elected as the "global controller" and stored in `gameSessionStore.controllerConnectionId`
 * - If the current controller goes offline, another client is automatically elected
 * - All clients run this hook, but only the controller executes the guarded logic
 *
 * @returns A boolean indicating if the current client is the global controller
 *
 * @example
 * // In App.tsx - hook must be called in all modes
 * function App() {
 *   useGlobalController();
 *   // ...rest of app code
 * }
 *
 * @example
 * // Adding new controller logic inside this hook
 * useEffect(() => {
 *   if (!isGlobalController) return;
 *
 *   // Your logic here - only runs on one device
 *   handleNextRound();
 * }, [isGlobalController, serverTime]);
 *
 * @see gameSessionStore for `controllerConnectionId` storage entry
 */
export function useGlobalController(): boolean {
	const { controllerConnectionId } = useSnapshot(gameSessionStore.proxy);
	const { phase, phaseStartTimestamp, programmingDuration, currentTick } =
		useSnapshot(matchStore.proxy);
	const { connectionIds } = useStoreConnections(gameSessionStore);

	const isGlobalController = controllerConnectionId === kmClient.connectionId;
	const serverTime = useServerTimer(500); // tick every 500ms for smoother execution

	// Track if we're currently executing to prevent duplicate ticks
	const isExecutingRef = useRef(false);

	// Maintain connection that is assigned to be the global controller
	// Any connected client can become controller - works across all modes (host, player, presenter)
	useEffect(() => {
		// Skip if no connections yet
		if (connectionIds.size === 0) {
			return;
		}

		// Check if global controller is online
		if (connectionIds.has(controllerConnectionId)) {
			return;
		}

		// Select new controller, sorting by connection id for deterministic selection
		kmClient
			.transact([gameSessionStore], ([gameSessionState]) => {
				// Double-check inside transaction to prevent race conditions
				if (connectionIds.has(gameSessionState.controllerConnectionId)) {
					return;
				}
				const connectionIdsArray = Array.from(connectionIds);
				connectionIdsArray.sort();
				gameSessionState.controllerConnectionId = connectionIdsArray[0] || '';
			})
			.then(() => {})
			.catch(() => {});
	}, [connectionIds, controllerConnectionId]);

	// Run global controller-specific logic
	useEffect(() => {
		if (!isGlobalController) {
			return;
		}

		// Handle programming phase timeout
		const handleProgrammingPhase = async () => {
			if (phase !== 'programming') return;

			const elapsedMs = serverTime - phaseStartTimestamp;
			const totalMs = programmingDuration * 1000;

			await kmClient.transact(
				[matchStore, robotProgramsStore, arenaStore],
				([matchState, programsState, arenaState]) => {
					if (matchState.phase !== 'programming') return;

					const aliveRobotIds = Object.entries(arenaState.robots)
						.filter(([, robot]) => robot.lives > 0)
						.map(([clientId]) => clientId);

					const allAliveSubmitted =
						aliveRobotIds.length > 0 &&
						aliveRobotIds.every(
							(clientId) => matchState.submittedPlayers[clientId] === true
						);

					const timedOut = elapsedMs >= totalMs;
					if (!timedOut && !allAliveSubmitted) {
						return;
					}

					for (const clientId of aliveRobotIds) {
						programsState.programs[clientId] = normalizeProgram(
							programsState.programs[clientId]
						);
						matchState.submittedPlayers[clientId] = true;
					}

					matchState.phase = 'executing';
					matchState.phaseStartTimestamp = kmClient.serverTimestamp();
					matchState.currentTick = -1; // Will increment to 0 on first tick
					matchState.executionEvents = {};
					matchState.resultReason = null;
				}
			);
		};

		handleProgrammingPhase();
	}, [
		isGlobalController,
		serverTime,
		phase,
		phaseStartTimestamp,
		programmingDuration
	]);

	// Handle execution phase - tick by tick
	useEffect(() => {
		if (!isGlobalController || phase !== 'executing') {
			isExecutingRef.current = false;
			return;
		}

		// Prevent duplicate execution
		if (isExecutingRef.current) return;

		const executeTickLogic = async () => {
			// Calculate which tick we should be on based on time elapsed
			const elapsedMs = serverTime - phaseStartTimestamp;
			const tickDuration = 1200; // 1.2 seconds per tick for animations
			const expectedTick = Math.floor(elapsedMs / tickDuration);
			const nextTick = currentTick + 1;

			// Use currentTick from store as source of truth for what's been executed
			// This ensures new controllers can correctly resume from where the previous left off.
			// When a controller falls behind, advance one tick at a time so collisions,
			// hazards, and animations still resolve in order.
			if (expectedTick > 4 && currentTick >= 4) {
				isExecutingRef.current = true;
				try {
					await handleExecutionComplete();
				} finally {
					isExecutingRef.current = false;
				}
				return;
			}

			if (nextTick > 4 || expectedTick < nextTick) {
				return;
			}

			isExecutingRef.current = true;

			try {
				// Execute the next pending tick in order.
				await executeTick(nextTick);
			} finally {
				isExecutingRef.current = false;
			}
		};

		executeTickLogic();
	}, [isGlobalController, serverTime, phase, phaseStartTimestamp, currentTick]);

	// Execute a single tick of robot commands
	const executeTick = async (tick: number) => {
		await kmClient.transact(
			[arenaStore, robotProgramsStore, matchStore],
			([arenaState, programsState, matchState]) => {
				const shrinkHazardDamage = Math.max(1, config.hazardShrinkDecayPerTick);
				const tickEvents: ExecutionEvent[] = [];

				const markEliminated = (clientId: string) => {
					if (!matchState.eliminatedPlayers[clientId]) {
						matchState.eliminatedPlayers[clientId] = true;
						matchState.eliminatedPlayerRounds[clientId] =
							matchState.currentRound;
					}
				};

				const applyPitHazardAtRobotPosition = (clientId: string) => {
					const robot = arenaState.robots[clientId];
					if (!robot || robot.lives <= 0) {
						return;
					}

					const terrainKey = `${robot.position.x},${robot.position.y}`;
					const terrainCell = arenaState.terrain?.[terrainKey];
					if (terrainCell?.type !== 'pit') {
						return;
					}

					if (terrainCell.source === 'hazard-shrink') {
						robot.lives = Math.max(0, robot.lives - shrinkHazardDamage);
					} else {
						robot.lives = 0;
					}

					if (robot.lives <= 0) {
						robot.lives = 0;
						markEliminated(clientId);
					}
				};

				const robotIds = Object.keys(arenaState.robots);
				const aliveRobotIds = robotIds.filter(
					(clientId) => (arenaState.robots[clientId]?.lives ?? 0) > 0
				);

				// 1. Process rotations first
				for (const clientId of aliveRobotIds) {
					const robot = arenaState.robots[clientId];
					const program = programsState.programs[clientId];
					if (!robot) continue;

					const command = getCommandAtTick(program, tick);
					if (command === 'rotate-left') {
						robot.rotation = ((robot.rotation - 90 + 360) % 360) as Rotation;
					} else if (command === 'rotate-right') {
						robot.rotation = ((robot.rotation + 90) % 360) as Rotation;
					}
				}

				// 2. Calculate intended movements
				const intendedMoves: Record<string, Position> = {};
				for (const clientId of aliveRobotIds) {
					const robot = arenaState.robots[clientId];
					const program = programsState.programs[clientId];
					if (!robot) continue;

					const command = getCommandAtTick(program, tick);
					if (command === 'move-forward') {
						const newPos = getForwardPosition(robot.position, robot.rotation);

						// Check bounds
						if (
							newPos.x >= 0 &&
							newPos.x < arenaState.gridSize.width &&
							newPos.y >= 0 &&
							newPos.y < arenaState.gridSize.height
						) {
							// Check obstacles
							const obstacleKey = `${newPos.x},${newPos.y}`;
							if (!arenaState.obstacles[obstacleKey]) {
								intendedMoves[clientId] = newPos;
							}
						}
					}
				}

				// 3. Resolve movement collisions
				const finalPositions = resolveSimultaneousMoves(
					aliveRobotIds,
					arenaState.robots,
					intendedMoves
				);

				// Apply movements
				for (const [clientId, pos] of Object.entries(finalPositions)) {
					if (arenaState.robots[clientId]) {
						arenaState.robots[clientId].position = pos;
					}
				}

				// 4. Pickup collection - check robots standing on pickups
				for (const clientId of aliveRobotIds) {
					const robot = arenaState.robots[clientId];
					if (!robot) continue;

					const pickupKey = `${robot.position.x},${robot.position.y}`;
					const pickup = arenaState.pickups[pickupKey];
					if (pickup) {
						// Apply pickup effect
						switch (pickup.type) {
							case 'health-pack':
								robot.lives = Math.min(3, robot.lives + 1);
								break;
							case 'shield':
								robot.shield = 1;
								break;
							case 'power-cell':
								robot.powerBoost = true;
								break;
						}
						// Remove collected pickup
						delete arenaState.pickups[pickupKey];
					}
				}

				// 5. Process shooting
				const hits: Array<{
					targetId: string;
					damage: number;
					shooterId: string;
				}> = [];

				for (const clientId of aliveRobotIds) {
					const robot = arenaState.robots[clientId];
					const program = programsState.programs[clientId];
					if (!robot) continue;

					const command = getCommandAtTick(program, tick);
					if (command === 'shoot') {
						tickEvents.push({
							tick,
							type: 'shoot',
							clientId,
							data: {
								from: { ...robot.position },
								rotation: robot.rotation
							}
						});

						// Find first robot in line of fire (only alive robots)
						const target = findShootTarget(
							robot.position,
							robot.rotation,
							arenaState.gridSize,
							arenaState.obstacles,
							arenaState.robots,
							clientId
						);

						if (target) {
							// Power boost deals 2 damage, otherwise 1
							const damage = robot.powerBoost ? 2 : 1;
							hits.push({ targetId: target, damage, shooterId: clientId });
						}

						// Consume power boost after shooting (whether hit or not)
						if (robot.powerBoost) {
							robot.powerBoost = false;
						}
					}
				}

				// Apply damage (shields absorb first)
				for (const hit of hits) {
					const robot = arenaState.robots[hit.targetId];
					if (robot && robot.lives > 0) {
						const livesBeforeHit = robot.lives;
						let remainingDamage = hit.damage;

						// Shield absorbs 1 damage then breaks
						if (robot.shield > 0) {
							robot.shield = 0;
							remainingDamage -= 1;
						}

						// Apply remaining damage to lives
						if (remainingDamage > 0) {
							const appliedDamage = Math.min(remainingDamage, livesBeforeHit);
							robot.lives -= remainingDamage;
							matchState.damageDealtByPlayer[hit.shooterId] =
								(matchState.damageDealtByPlayer[hit.shooterId] ?? 0) +
								appliedDamage;
							if (robot.lives <= 0) {
								robot.lives = 0;
								markEliminated(hit.targetId);
							}
						}
					}
				}

				// 6. Apply pit hazards after movement.
				// Map pits still instantly eliminate, while shrink pits decay lives.
				for (const clientId of aliveRobotIds) {
					applyPitHazardAtRobotPosition(clientId);
				}

				// 7. Apply conveyor belt movements (end of tick)
				const conveyorMoves: Record<string, Position> = {};
				for (const clientId of aliveRobotIds) {
					const robot = arenaState.robots[clientId];
					if (!robot || robot.lives <= 0) continue;

					const terrainKey = `${robot.position.x},${robot.position.y}`;
					const terrainCell = arenaState.terrain?.[terrainKey];
					if (
						terrainCell?.type === 'conveyor' &&
						terrainCell.direction !== undefined
					) {
						// Calculate push direction
						const dir = terrainCell.direction;
						const dx = dir === 90 ? 1 : dir === 270 ? -1 : 0;
						const dy = dir === 180 ? 1 : dir === 0 ? -1 : 0;
						const newX = robot.position.x + dx;
						const newY = robot.position.y + dy;

						// Check if push destination is valid
						if (
							newX >= 0 &&
							newX < arenaState.gridSize.width &&
							newY >= 0 &&
							newY < arenaState.gridSize.height &&
							!arenaState.obstacles[`${newX},${newY}`]
						) {
							conveyorMoves[clientId] = { x: newX, y: newY };
						}
					}
				}

				// Resolve conveyor collisions (same rules as movement)
				const finalConveyorPositions = resolveSimultaneousMoves(
					aliveRobotIds,
					arenaState.robots,
					conveyorMoves
				);

				for (const [clientId, newPos] of Object.entries(
					finalConveyorPositions
				)) {
					if (!arenaState.robots[clientId]) {
						continue;
					}

					arenaState.robots[clientId].position = newPos;
					applyPitHazardAtRobotPosition(clientId);
				}

				for (const [index, event] of tickEvents.entries()) {
					matchState.executionEvents[
						`${kmClient.serverTimestamp()}-${tick}-${index}`
					] = event;
				}

				matchState.currentTick = tick;

				const aliveRobots = Object.entries(arenaState.robots)
					.filter(([, robot]) => robot.lives > 0)
					.map(([id]) => id);

				if (aliveRobots.length <= 1) {
					setMatchResult(
						matchState,
						aliveRobots[0] ?? '',
						aliveRobots.length === 1 ? 'last-standing' : 'simultaneous-draw'
					);
				}
			}
		);
	};

	// Handle completion of execution phase
	const handleExecutionComplete = async () => {
		await kmClient.transact(
			[matchStore, arenaStore, robotProgramsStore],
			([matchState, arenaState, programsState]) => {
				// Guard: only proceed if still in executing phase
				if (matchState.phase !== 'executing') return;

				// Only count robots with lives > 0
				const aliveRobots = Object.entries(arenaState.robots)
					.filter(([, robot]) => robot.lives > 0)
					.map(([id]) => id);

				// Check win conditions
				if (aliveRobots.length === 0) {
					setMatchResult(matchState, '', 'simultaneous-draw');
				} else if (aliveRobots.length === 1) {
					setMatchResult(matchState, aliveRobots[0], 'last-standing');
				} else if (matchState.currentRound >= matchState.maxRounds) {
					const timeoutResult = resolveTimeoutResult(
						arenaState.robots,
						matchState.damageDealtByPlayer
					);
					setMatchResult(
						matchState,
						timeoutResult.winnerId,
						timeoutResult.resultReason
					);
				} else {
					// Start next round
					matchState.phase = 'programming';
					matchState.currentRound += 1;
					matchState.phaseStartTimestamp = kmClient.serverTimestamp();
					matchState.submittedPlayers = {};
					matchState.currentTick = -1;
					matchState.executionEvents = {};
					matchState.resultReason = null;
					programsState.programs = {};

					// Escalate hazards each round by shrinking safe area inward
					arenaState.terrain = applyHazardEscalation(
						arenaState.terrain,
						arenaState.obstacles,
						arenaState.gridSize,
						matchState.currentRound
					);

					// Spawn new pickups for the round
					const robotPositions = Object.values(arenaState.robots)
						.filter((r) => r.lives > 0)
						.map((r) => r.position);
					arenaState.pickups = generatePickups(
						arenaState.gridSize,
						arenaState.obstacles,
						arenaState.terrain,
						robotPositions
					);
				}
			}
		);
	};

	return isGlobalController;
}

function setMatchResult(
	matchState: {
		phase: 'lobby' | 'programming' | 'executing' | 'results';
		winnerId: string;
		resultReason: MatchResultReason | null;
		phaseStartTimestamp: number;
	},
	winnerId: string,
	resultReason: MatchResultReason
) {
	matchState.phase = 'results';
	matchState.winnerId = winnerId;
	matchState.resultReason = resultReason;
	matchState.phaseStartTimestamp = kmClient.serverTimestamp();
}

function resolveTimeoutResult(
	robots: Record<string, { lives: number }>,
	damageDealtByPlayer: Record<string, number>
): { winnerId: string; resultReason: MatchResultReason } {
	const aliveRobots = Object.entries(robots).filter(
		([, robot]) => robot.lives > 0
	);
	if (aliveRobots.length === 0) {
		return { winnerId: '', resultReason: 'timeout-draw' };
	}

	const highestLives = Math.max(...aliveRobots.map(([, robot]) => robot.lives));
	const lifeLeaders = aliveRobots.filter(
		([, robot]) => robot.lives === highestLives
	);

	if (lifeLeaders.length === 1) {
		return { winnerId: lifeLeaders[0][0], resultReason: 'timeout-lives' };
	}

	const highestDamage = Math.max(
		...lifeLeaders.map(([clientId]) => damageDealtByPlayer[clientId] ?? 0)
	);
	const damageLeaders = lifeLeaders.filter(
		([clientId]) => (damageDealtByPlayer[clientId] ?? 0) === highestDamage
	);

	if (damageLeaders.length === 1) {
		return { winnerId: damageLeaders[0][0], resultReason: 'timeout-damage' };
	}

	return { winnerId: '', resultReason: 'timeout-draw' };
}

/** Get the position one cell forward based on rotation */
function getForwardPosition(pos: Position, rotation: Rotation): Position {
	switch (rotation) {
		case 0: // Up
			return { x: pos.x, y: pos.y - 1 };
		case 90: // Right
			return { x: pos.x + 1, y: pos.y };
		case 180: // Down
			return { x: pos.x, y: pos.y + 1 };
		case 270: // Left
			return { x: pos.x - 1, y: pos.y };
		default:
			return pos;
	}
}

function resolveSimultaneousMoves(
	aliveRobotIds: string[],
	robots: Record<string, { position: Position; lives: number }>,
	intendedMoves: Record<string, Position>
): Record<string, Position> {
	// Robots that are confirmed blocked and will not move this tick.
	const blocked = new Set<string>();

	// Robots that have no intended move are always treated as stationary.
	for (const clientId of aliveRobotIds) {
		if (!intendedMoves[clientId]) {
			blocked.add(clientId);
		}
	}

	// Iterative fixed-point: keep resolving until no new robots become blocked.
	// This handles chain-blocking scenarios where A→B→C(wall) must block both A and B.
	let changed = true;
	while (changed) {
		changed = false;

		// Build the set of cells occupied by blocked robots.
		const occupiedByBlocked = new Set<string>();
		for (const clientId of blocked) {
			const robot = robots[clientId];
			if (!robot || robot.lives <= 0) {
				continue;
			}
			occupiedByBlocked.add(`${robot.position.x},${robot.position.y}`);
		}

		// Count how many non-blocked movers target each cell.
		const destinationCounts: Record<string, number> = {};
		for (const [clientId, destination] of Object.entries(intendedMoves)) {
			if (blocked.has(clientId)) {
				continue;
			}
			const key = `${destination.x},${destination.y}`;
			destinationCounts[key] = (destinationCounts[key] ?? 0) + 1;
		}

		// Collect robots that must be blocked this iteration before mutating
		// the blocked set, so contested pairs are all evaluated in the same pass.
		const newlyBlocked: string[] = [];

		for (const [clientId, destination] of Object.entries(intendedMoves)) {
			if (blocked.has(clientId)) {
				continue;
			}

			const robot = robots[clientId];
			if (!robot || robot.lives <= 0) {
				continue;
			}

			const destinationKey = `${destination.x},${destination.y}`;

			// Contested: two or more non-blocked movers target the same cell.
			if ((destinationCounts[destinationKey] ?? 0) > 1) {
				newlyBlocked.push(clientId);
				continue;
			}

			// Blocked cell: destination occupied by a blocked (stationary) robot.
			if (occupiedByBlocked.has(destinationKey)) {
				newlyBlocked.push(clientId);
				continue;
			}

			// Head-on swap: two non-blocked robots exchanging positions.
			const hasHeadOnSwap = Object.entries(intendedMoves).some(
				([otherClientId, otherDestination]) => {
					if (otherClientId === clientId || blocked.has(otherClientId)) {
						return false;
					}
					const otherRobot = robots[otherClientId];
					if (!otherRobot || otherRobot.lives <= 0) {
						return false;
					}
					return (
						otherDestination.x === robot.position.x &&
						otherDestination.y === robot.position.y &&
						destination.x === otherRobot.position.x &&
						destination.y === otherRobot.position.y
					);
				}
			);

			if (hasHeadOnSwap) {
				newlyBlocked.push(clientId);
			}
		}

		for (const clientId of newlyBlocked) {
			blocked.add(clientId);
			changed = true;
		}
	}

	// Build final positions: only robots with an intended move that are not blocked.
	const finalPositions: Record<string, Position> = {};
	for (const [clientId, destination] of Object.entries(intendedMoves)) {
		if (!blocked.has(clientId)) {
			finalPositions[clientId] = destination;
		}
	}

	return finalPositions;
}

/** Find the first robot hit by a shot (hit-scan) - only targets alive robots */
function findShootTarget(
	from: Position,
	rotation: Rotation,
	gridSize: { width: number; height: number },
	obstacles: Record<string, Position>,
	robots: Record<string, { position: Position; lives: number }>,
	shooterId: string
): string | null {
	const dx = rotation === 90 ? 1 : rotation === 270 ? -1 : 0;
	const dy = rotation === 180 ? 1 : rotation === 0 ? -1 : 0;

	let x = from.x + dx;
	let y = from.y + dy;

	while (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
		// Check obstacle
		if (obstacles[`${x},${y}`]) {
			return null;
		}

		// Check robot (only alive ones)
		for (const [clientId, robot] of Object.entries(robots)) {
			if (
				clientId !== shooterId &&
				robot.lives > 0 &&
				robot.position.x === x &&
				robot.position.y === y
			) {
				return clientId;
			}
		}

		x += dx;
		y += dy;
	}

	return null;
}
