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

/** Pre-defined map layout identifiers */
export type MapLayoutId = 'open' | 'cross' | 'maze';

/** Map layout definition */
export interface MapLayout {
	id: MapLayoutId;
	name: string;
	obstacles: Position[];
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
