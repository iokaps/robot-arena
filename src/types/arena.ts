/** Position on the arena grid */
export interface Position {
	x: number;
	y: number;
}

/** Robot rotation in degrees (0=up, 90=right, 180=down, 270=left) */
export type Rotation = 0 | 90 | 180 | 270;

/** Available robot colors */
export type RobotColor =
	| 'cyan'
	| 'fuchsia'
	| 'lime'
	| 'orange'
	| 'rose'
	| 'violet';

/** Robot command types */
export type MoveCommand =
	| 'move-forward'
	| 'rotate-left'
	| 'rotate-right'
	| 'shoot'
	| 'wait';

/** Robot state on the arena */
export interface RobotState {
	position: Position;
	rotation: Rotation;
	lives: number;
	color: RobotColor;
	/** Player name for display */
	name: string;
	/** Shield - absorbs next hit then disappears (0 or 1) */
	shield: number;
	/** Power boost - next shot deals 2 damage, consumed on use */
	powerBoost: boolean;
}

/** Pickup types available in the arena */
export type PickupType = 'health-pack' | 'shield' | 'power-cell';

/** Pickup cell definition */
export interface PickupCell {
	position: Position;
	type: PickupType;
}

/** Game phase state machine */
export type GamePhase = 'lobby' | 'programming' | 'executing' | 'results';

/** Terrain cell types */
export type TerrainType = 'wall' | 'pit' | 'conveyor';

/** Source for terrain hazards to distinguish map tiles from dynamic shrink rings */
export type TerrainSource = 'map' | 'hazard-shrink';

/** Terrain cell definition */
export interface TerrainCell {
	position: Position;
	type: TerrainType;
	/** Direction for conveyor belts */
	direction?: Rotation;
	/** Optional terrain source (used for hazard ring rules) */
	source?: TerrainSource;
}

/** Pre-defined map layout identifiers */
export type MapLayoutId = 'open';

/** Map layout definition */
export interface MapLayout {
	id: MapLayoutId;
	name: string;
	obstacles: Position[];
}

/** Arena map configuration */
export interface ArenaMapConfig {
	id: string;
	/** Minimum players for this map size */
	minPlayers: number;
	/** Maximum players for this map size */
	maxPlayers: number;
	/** Grid dimensions */
	gridSize: { width: number; height: number };
	/** Obstacle density (0-1) */
	obstacleDensity: number;
}

/** Execution event for animation */
export interface ExecutionEvent {
	tick: number;
	type: 'move' | 'rotate' | 'shoot' | 'hit' | 'collision' | 'elimination';
	clientId: string;
	data?: {
		from?: Position;
		to?: Position;
		rotation?: Rotation;
		targetId?: string;
		damage?: number;
	};
}
