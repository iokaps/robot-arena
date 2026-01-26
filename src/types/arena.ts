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
}

/** Game phase state machine */
export type GamePhase = 'lobby' | 'programming' | 'executing' | 'results';

/** Terrain cell types */
export type TerrainType = 'wall' | 'pit' | 'conveyor';

/** Terrain cell definition */
export interface TerrainCell {
	position: Position;
	type: TerrainType;
	/** Direction for conveyor belts */
	direction?: Rotation;
}

/** Pre-defined map layout identifiers */
export type MapLayoutId =
	| 'open'
	| 'cross'
	| 'maze'
	| 'gauntlet'
	| 'factory'
	| 'deathtrap';

/** Map layout definition */
export interface MapLayout {
	id: MapLayoutId;
	name: string;
	obstacles: Position[];
}

/** Arena size identifiers */
export type ArenaSizeId = 'auto' | 'small' | 'medium' | 'large' | 'mega';

/** Arena map configuration based on player count */
export interface ArenaMapConfig {
	id: ArenaSizeId;
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
