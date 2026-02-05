import { kmClient } from '@/services/km-client';
import { generatePickups } from '@/state/actions/arena-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { gameSessionStore } from '@/state/stores/game-session-store';
import { matchStore } from '@/state/stores/match-store';
import { robotProgramsStore } from '@/state/stores/robot-programs-store';
import type { Position, Rotation } from '@/types/arena';
import { useSnapshot } from '@kokimoki/app';
import { useEffect, useRef } from 'react';
import { useServerTimer } from './useServerTime';
import { useStoreConnections } from './useStoreConnections';

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

			// Check if programming time is up
			if (elapsedMs >= totalMs) {
				// Transition to execution phase
				await kmClient.transact(
					[matchStore, robotProgramsStore, arenaStore],
					([matchState, programsState, arenaState]) => {
						if (matchState.phase !== 'programming') return;

						// Auto-submit 'wait' for players who didn't submit
						const activeRobots = Object.keys(arenaState.robots);
						for (const clientId of activeRobots) {
							if (!programsState.programs[clientId]) {
								programsState.programs[clientId] = [
									'wait',
									'wait',
									'wait',
									'wait',
									'wait'
								];
								matchState.submittedPlayers[clientId] = true;
							}
						}

						matchState.phase = 'executing';
						matchState.phaseStartTimestamp = kmClient.serverTimestamp();
						matchState.currentTick = -1; // Will increment to 0 on first tick
					}
				);
			}
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

			// Use currentTick from store as source of truth for what's been executed
			// This ensures new controllers can correctly resume from where the previous left off
			if (expectedTick <= currentTick || expectedTick > 4) {
				// Check if execution is complete
				if (expectedTick > 4 && currentTick >= 4) {
					// Execution complete, check for winner or start next round
					await handleExecutionComplete();
				}
				return;
			}

			isExecutingRef.current = true;

			try {
				// Execute the current tick
				await executeTick(expectedTick);

				// Update the tick counter in the store
				await kmClient.transact([matchStore], ([matchState]) => {
					matchState.currentTick = expectedTick;
				});
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
				const robotIds = Object.keys(arenaState.robots);

				// 1. Process rotations first
				for (const clientId of robotIds) {
					const robot = arenaState.robots[clientId];
					const program = programsState.programs[clientId];
					if (!robot || !program || robot.lives <= 0) continue;

					const command = program[tick];
					if (command === 'rotate-left') {
						robot.rotation = ((robot.rotation - 90 + 360) % 360) as Rotation;
					} else if (command === 'rotate-right') {
						robot.rotation = ((robot.rotation + 90) % 360) as Rotation;
					}
				}

				// 2. Calculate intended movements
				const intendedMoves: Record<string, Position> = {};
				for (const clientId of robotIds) {
					const robot = arenaState.robots[clientId];
					const program = programsState.programs[clientId];
					if (!robot || !program || robot.lives <= 0) continue;

					const command = program[tick];
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
				const finalPositions: Record<string, Position> = {};
				const destinationCounts: Record<string, string[]> = {};

				// Count how many robots want to move to each cell
				for (const [clientId, pos] of Object.entries(intendedMoves)) {
					const key = `${pos.x},${pos.y}`;
					if (!destinationCounts[key]) {
						destinationCounts[key] = [];
					}
					destinationCounts[key].push(clientId);
				}

				// Also check if destination is occupied by a non-moving robot
				for (const clientId of robotIds) {
					const robot = arenaState.robots[clientId];
					if (!robot) continue;
					if (!intendedMoves[clientId]) {
						// This robot is staying put
						const key = `${robot.position.x},${robot.position.y}`;
						if (!destinationCounts[key]) {
							destinationCounts[key] = [];
						}
						// Mark this cell as occupied
					}
				}

				// Resolve collisions
				for (const [clientId, pos] of Object.entries(intendedMoves)) {
					const key = `${pos.x},${pos.y}`;

					// Check if multiple robots want this cell
					if (destinationCounts[key].length > 1) {
						// Collision - nobody moves to this cell
						continue;
					}

					// Check if a stationary robot is there
					const occupyingRobot = robotIds.find((id) => {
						const r = arenaState.robots[id];
						return (
							r &&
							!intendedMoves[id] &&
							r.position.x === pos.x &&
							r.position.y === pos.y
						);
					});

					if (occupyingRobot) {
						// Can't move into occupied cell
						continue;
					}

					// Check for head-on collision (swap)
					const swappingRobot = robotIds.find((otherId) => {
						if (otherId === clientId) return false;
						const otherMove = intendedMoves[otherId];
						const myRobot = arenaState.robots[clientId];
						if (!otherMove || !myRobot) return false;

						return (
							otherMove.x === myRobot.position.x &&
							otherMove.y === myRobot.position.y
						);
					});

					if (swappingRobot) {
						// Head-on collision - both stay
						continue;
					}

					finalPositions[clientId] = pos;
				}

				// Apply movements
				for (const [clientId, pos] of Object.entries(finalPositions)) {
					if (arenaState.robots[clientId]) {
						arenaState.robots[clientId].position = pos;
					}
				}

				// 4. Pickup collection - check robots standing on pickups
				for (const clientId of robotIds) {
					const robot = arenaState.robots[clientId];
					if (!robot || robot.lives <= 0) continue;

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

				for (const clientId of robotIds) {
					const robot = arenaState.robots[clientId];
					const program = programsState.programs[clientId];
					if (!robot || !program || robot.lives <= 0) continue;

					const command = program[tick];
					if (command === 'shoot') {
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
						let remainingDamage = hit.damage;

						// Shield absorbs 1 damage then breaks
						if (robot.shield > 0) {
							robot.shield = 0;
							remainingDamage -= 1;
						}

						// Apply remaining damage to lives
						if (remainingDamage > 0) {
							robot.lives -= remainingDamage;
							if (robot.lives <= 0) {
								robot.lives = 0;
								matchState.eliminatedPlayers[hit.targetId] = true;
							}
						}
					}
				}

				// 6. Check for pit deaths (robots standing on pits after movement)
				for (const clientId of robotIds) {
					const robot = arenaState.robots[clientId];
					if (!robot || robot.lives <= 0) continue;

					const terrainKey = `${robot.position.x},${robot.position.y}`;
					const terrainCell = arenaState.terrain?.[terrainKey];
					if (terrainCell?.type === 'pit') {
						// Instant death from pit
						robot.lives = 0;
						matchState.eliminatedPlayers[clientId] = true;
					}
				}

				// 7. Apply conveyor belt movements (end of tick)
				const conveyorMoves: Record<string, Position> = {};
				for (const clientId of robotIds) {
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

				// Resolve conveyor collisions (similar to movement)
				for (const [clientId, newPos] of Object.entries(conveyorMoves)) {
					// Check if another robot is already there (and not being pushed)
					const blocked = robotIds.some((otherId) => {
						if (otherId === clientId) return false;
						const other = arenaState.robots[otherId];
						if (!other || other.lives <= 0) return false;
						// Check if other is at destination and not being pushed away
						if (
							other.position.x === newPos.x &&
							other.position.y === newPos.y
						) {
							return !conveyorMoves[otherId];
						}
						return false;
					});

					if (!blocked && arenaState.robots[clientId]) {
						arenaState.robots[clientId].position = newPos;

						// Check if pushed onto pit
						const newTerrainKey = `${newPos.x},${newPos.y}`;
						const newTerrain = arenaState.terrain?.[newTerrainKey];
						if (newTerrain?.type === 'pit') {
							arenaState.robots[clientId].lives = 0;
							matchState.eliminatedPlayers[clientId] = true;
						}
					}
				}
			}
		);
	};

	// Handle completion of execution phase
	const handleExecutionComplete = async () => {
		await kmClient.transact(
			[matchStore, arenaStore, robotProgramsStore],
			([matchState, arenaState, programsState]) => {
				// Only count robots with lives > 0
				const aliveRobots = Object.entries(arenaState.robots)
					.filter(([, robot]) => robot.lives > 0)
					.map(([id]) => id);

				// Check win conditions
				if (aliveRobots.length === 0) {
					// Draw - all eliminated
					matchState.phase = 'results';
					matchState.winnerId = '';
					matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				} else if (aliveRobots.length === 1) {
					// Winner!
					matchState.phase = 'results';
					matchState.winnerId = aliveRobots[0];
					matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				} else if (matchState.currentRound >= matchState.maxRounds) {
					// Max rounds reached - most lives wins
					let maxLives = 0;
					let winnerId = '';
					for (const [clientId, robot] of Object.entries(arenaState.robots)) {
						if (robot.lives > maxLives) {
							maxLives = robot.lives;
							winnerId = clientId;
						}
					}
					matchState.phase = 'results';
					matchState.winnerId = winnerId;
					matchState.phaseStartTimestamp = kmClient.serverTimestamp();
				} else {
					// Start next round
					matchState.phase = 'programming';
					matchState.currentRound += 1;
					matchState.phaseStartTimestamp = kmClient.serverTimestamp();
					matchState.submittedPlayers = {};
					matchState.currentTick = -1;
					programsState.programs = {};

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
