import { z } from '@kokimoki/kit';

export const schema = z.object({
	// Game title
	title: z.string().default('Code-A-Bot Arena'),

	// Lobby
	gameLobbyMd: z
		.string()
		.default(
			'# Welcome to Code-A-Bot Arena!\n\nProgram your robot and battle in the arena. Wait for the host to start the match.'
		),
	presenterLobbyMessage: z.string().default('Waiting for players to join...'),
	playersJoinedLabel: z.string().default('players joined'),
	scanToJoinMessage: z.string().default('Scan the QR code to join the battle'),
	minPlayersMessage: z.string().default('Need at least 2 players'),

	// Player profile
	createProfileMd: z
		.string()
		.default('# Enter the Arena\n\nChoose your pilot name to begin.'),
	playerNamePlaceholder: z.string().default('Pilot name...'),
	playerNameLabel: z.string().default('Name:'),
	playerNameButton: z.string().default('Join Arena'),

	// Navigation
	playerLinkLabel: z.string().default('Player Link'),
	presenterLinkLabel: z.string().default('Presenter Link'),
	togglePresenterQrButton: z.string().default('Toggle QR Code'),
	menuAriaLabel: z.string().default('Open menu'),
	menuHelpAriaLabel: z.string().default('Help'),

	// Help
	menuHelpMd: z
		.string()
		.default(
			'# How to Play\n\n1. **Program** your robot with 5 moves\n2. **Submit** before time runs out\n3. **Watch** all robots execute simultaneously\n4. **Survive** to win!\n\n## Commands\n- **Move Forward**: Move one cell in facing direction\n- **Rotate Left/Right**: Turn 90 degrees\n- **Shoot**: Fire a laser in facing direction\n- **Wait**: Do nothing this turn'
		),

	// Host controls
	phaseLabel: z.string().default('Phase'),
	phaseLobby: z.string().default('Lobby'),
	phaseProgramming: z.string().default('Programming'),
	phaseExecuting: z.string().default('Executing'),
	phaseResults: z.string().default('Results'),
	arenaSizeLabel: z.string().default('Arena Size'),
	mapSelectLabel: z.string().default('Obstacle Layout'),
	mapAutoSelectLabel: z.string().default('Auto'),
	mapOpenLabel: z.string().default('Open'),
	mapCrossLabel: z.string().default('Cross'),
	mapMazeLabel: z.string().default('Maze'),
	mapGauntletLabel: z.string().default('Gauntlet'),
	mapFactoryLabel: z.string().default('Factory'),
	mapDeathtrapLabel: z.string().default('Death Trap'),
	mapSmallLabel: z.string().default('Small (10×10)'),
	mapMediumLabel: z.string().default('Medium (14×14)'),
	mapLargeLabel: z.string().default('Large (18×18)'),
	mapMegaLabel: z.string().default('Mega (22×22)'),
	forPlayersLabel: z.string().default('for'),
	robotStatusLabel: z.string().default('Robots'),
	startMatchButton: z.string().default('Start Match'),
	resetMatchButton: z.string().default('Reset Match'),
	startButton: z.string().default('Start Match'),
	stopButton: z.string().default('End Match'),

	// Host How to Play
	hostHowToPlayTitle: z.string().default('How to Play'),
	hostSetupTitle: z.string().default('Setup'),
	hostSetupStep1: z.string().default('Share the Player Link or QR code'),
	hostSetupStep2: z.string().default('Wait for players to join (min. 2)'),
	hostSetupStep3: z.string().default('Select arena size and map layout'),
	hostSetupStep4: z.string().default('Click Start Match when ready'),
	hostTerrainTitle: z.string().default('Terrain Types'),
	hostTerrainWall: z.string().default('Wall - Blocks movement & lasers'),
	hostTerrainPit: z.string().default('Pit - Instant elimination'),
	hostTerrainConveyor: z.string().default('Conveyor - Pushes robots each tick'),
	hostPickupsTitle: z.string().default('Pickups'),
	hostPickupHealthPack: z.string().default('Health Pack - Restores 1 life'),
	hostPickupShield: z.string().default('Shield - Blocks next hit'),
	hostPickupPowerCell: z
		.string()
		.default('Power Cell - Next shot deals 2 damage'),
	hostRulesTitle: z.string().default('Quick Rules'),
	hostRule1: z.string().default('Each robot has 3 lives'),
	hostRule2: z.string().default('60 seconds to program 5 moves'),
	hostRule3: z.string().default('All robots execute simultaneously'),

	// Programming phase
	programmingPhaseTitle: z.string().default('Program Your Bot'),
	livesLabel: z.string().default('Lives'),
	commandMoveForward: z.string().default('Move'),
	commandRotateLeft: z.string().default('Left'),
	commandRotateRight: z.string().default('Right'),
	commandShoot: z.string().default('Shoot'),
	commandWait: z.string().default('Wait'),
	clearButton: z.string().default('Clear'),
	submitButton: z.string().default('Submit'),
	submittedMessage: z.string().default('Program Locked In!'),
	submittedLabel: z.string().default('submitted'),

	// Execution phase
	tickLabel: z.string().default('Tick'),
	roundLabel: z.string().default('Round'),
	yourProgramLabel: z.string().default('Your Program'),

	// Eliminated
	eliminatedTitle: z.string().default("You're Out!"),
	eliminatedMessage: z.string().default('Your robot has been destroyed.'),
	roundsSurvivedLabel: z.string().default('Rounds Survived'),
	eliminatedWaitingMessage: z
		.string()
		.default('Watch the remaining bots battle it out...'),

	// Results
	winnerTitle: z.string().default('Victory!'),
	drawTitle: z.string().default('Draw!'),
	drawMessage: z.string().default('All robots were destroyed simultaneously.'),
	matchCompleteMessage: z
		.string()
		.default('The match has ended. Waiting for host to start a new match.'),

	// Misc
	loading: z.string().default('Loading...'),
	players: z.string().default('Players'),
	online: z.string().default('Online'),
	offline: z.string().default('Offline')
});

export type Config = z.infer<typeof schema>;
