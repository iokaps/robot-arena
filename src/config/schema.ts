import { z } from '@kokimoki/kit';

export const schema = z.object({
	// Game title
	title: z.string().default('Code-A-Bot Arena'),

	// Lobby
	gameLobbyMd: z
		.string()
		.default(
			'# Welcome to Code-A-Bot Arena!\n\nProgram your robot, survive the hazards, and be the last bot standing. Match size: 2-10 players. Wait for the host to start the match.'
		),
	presenterLobbyMessage: z
		.string()
		.default('Waiting for players to join (2-10)...'),
	playersJoinedLabel: z.string().default('players joined'),
	scanToJoinMessage: z.string().default('Scan the QR code to join the battle'),
	minPlayersMessage: z.string().default('Need at least 2 players'),
	maxPlayersMessage: z
		.string()
		.default('Maximum 10 active players for this arena'),
	joinNextRoundBannerTitle: z.string().default('Spectating This Match'),
	joinNextRoundBannerMessage: z
		.string()
		.default(
			'You joined after the round roster was locked. You will play next match.'
		),
	hostReconnectHintMessage: z
		.string()
		.default(
			'If someone reconnects, ask them to use the same pilot name to reclaim their robot.'
		),

	// Player profile
	createProfileMd: z
		.string()
		.default(
			'# Enter the Arena\n\nChoose your pilot name to begin (up to 10 active pilots per match).'
		),
	rejoinHintMessage: z
		.string()
		.default(
			'Rejoining mid-match? Use your previous pilot name to reclaim your robot.'
		),
	playerNamePlaceholder: z.string().default('Pilot name...'),
	playerNameLabel: z.string().default('Name:'),
	playerNameButton: z.string().default('Join Arena'),
	playerNameMaxLength: z.number().int().min(1).default(7),

	// Navigation
	playerLinkLabel: z.string().default('Player Link'),
	presenterLinkLabel: z.string().default('Presenter Link'),
	togglePresenterQrButton: z.string().default('Toggle QR Code'),
	menuHelpAriaLabel: z.string().default('Help'),

	// Help
	menuHelpMd: z
		.string()
		.default(
			'# How to Play\n\n## Goal\nBe the last robot standing. If everyone is destroyed on the same tick, the round ends in a draw.\n\n## Round Flow\n1. **Program** up to 5 commands in 60 seconds\n2. **Submit** to lock your sequence\n3. **Execute** while every robot acts at the same time\n4. **Repeat** until only one robot is left\n\n## Commands\n- **Move Forward**: Move one cell in the direction you are facing\n- **Rotate Left / Right**: Turn 90 degrees before movement resolves\n- **Shoot**: Fire a laser in the direction you are facing\n- **Wait**: Leave a slot empty to do nothing on that tick\n\n## Pickups\n- **Health Pack**: Restore 1 life, up to a maximum of 3\n- **Shield**: Block the next incoming hit\n- **Power Cell**: Make your next shot deal 2 damage\n\n## Hazards\n- **Walls** block movement and lasers\n- **Map pits** destroy robots instantly\n- **Shrink skull pits** drain 1 life per tick\n- **Conveyors** push robots one cell at the end of the tick\n\n## Tips\n- Use empty slots to avoid collisions or bait shots\n- Collect center pickups when the arena opens up\n- Watch the edge when the skull ring is about to shrink'
		),

	// Host controls
	phaseLabel: z.string().default('Phase'),
	phaseLobby: z.string().default('Lobby'),
	phaseProgramming: z.string().default('Programming'),
	phaseExecuting: z.string().default('Executing'),
	phaseResults: z.string().default('Results'),
	allSubmittedStartingMessage: z
		.string()
		.default('All moves submitted — starting now'),
	mapSelectLabel: z.string().default('Obstacle Layout'),
	mapOpenLabel: z.string().default('Open'),
	mapCrossLabel: z.string().default('Cross'),
	mapMazeLabel: z.string().default('Maze'),
	mapGauntletLabel: z.string().default('Gauntlet'),
	mapFactoryLabel: z.string().default('Factory'),
	mapDeathtrapLabel: z.string().default('Death Trap'),
	robotStatusLabel: z.string().default('Robots'),
	startMatchButton: z.string().default('Start Match'),
	rematchButton: z.string().default('Rematch'),
	resetMatchButton: z.string().default('Reset Match'),

	// Host How to Play
	hostHowToPlayTitle: z.string().default('How to Play'),
	hostSetupTitle: z.string().default('Setup'),
	hostSetupStep1: z.string().default('Share the Player Link or QR code'),
	hostSetupStep2: z.string().default('Wait for players to join (2-10 players)'),
	hostSetupStep3: z.string().default('Review the arena layout'),
	hostSetupStep4: z.string().default('Click Start Match when ready'),
	hostTerrainTitle: z.string().default('Terrain Types'),
	hostTerrainWall: z.string().default('Wall - Blocks movement & lasers'),
	hostTerrainPit: z
		.string()
		.default('Pit - Map pits eliminate instantly; shrink skulls drain 1 life'),
	hostTerrainConveyor: z.string().default('Conveyor - Pushes robots each tick'),
	hostPickupTitle: z.string().default('Pickups'),
	hostPickupHealthPack: z
		.string()
		.default('Health Pack - Restores 1 life up to the 3-life maximum'),
	hostPickupShield: z.string().default('Shield - Blocks the next incoming hit'),
	hostPickupPowerCell: z
		.string()
		.default('Power Cell - Makes the next shot deal 2 damage'),
	hostRulesTitle: z.string().default('Quick Rules'),
	hostRule1: z.string().default('Each robot has 3 lives'),
	hostRule2: z.string().default('60 seconds to program 5 moves'),
	hostRule3: z.string().default('All robots execute simultaneously'),
	hostRule4: z.string().default('Open Arena is the only layout in this build'),

	// Programming phase
	programmingPhaseTitle: z.string().default('Program Your Bot'),
	livesLabel: z.string().default('Lives'),
	commandMoveForward: z.string().default('Move'),
	commandRotateLeft: z.string().default('Left'),
	commandRotateRight: z.string().default('Right'),
	commandShoot: z.string().default('Shoot'),
	clearButton: z.string().default('Clear'),
	submitButton: z.string().default('Submit'),
	submittedMessage: z.string().default('Program Locked In!'),
	submittedLabel: z.string().default('submitted'),

	// Execution phase
	tickLabel: z.string().default('Tick'),
	roundLabel: z.string().default('Round'),
	yourProgramLabel: z.string().default('Your Program'),
	hazardShrinkWarningTitle: z.string().default('Arena Shrink Incoming'),
	hazardShrinkWarningMessage: z
		.string()
		.default('Skull ring will close in next round. Stay away from the edge.'),

	// Eliminated
	eliminatedTitle: z.string().default("You're Out!"),
	eliminatedMessage: z.string().default('Your robot has been destroyed.'),
	eliminatedRoundMessage: z.string().default('Eliminated in Round'),
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
	hazardEscalationEveryNRounds: z.number().int().min(1).default(2),
	hazardShrinkDecayPerTick: z.number().int().min(1).default(1),

	// Misc
	loading: z.string().default('Loading...'),
	online: z.string().default('Online'),
	logoText: z.string().default('Code-A-Bot')
});

export type Config = z.infer<typeof schema>;
