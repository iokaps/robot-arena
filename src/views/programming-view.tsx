import { config } from '@/config';
import { useServerTimer } from '@/hooks/useServerTime';
import { kmClient } from '@/services/km-client';
import { willArenaShrinkNextRound } from '@/state/actions/arena-actions';
import { localPlayerActions } from '@/state/actions/local-player-actions';
import { matchActions } from '@/state/actions/match-actions';
import { arenaStore } from '@/state/stores/arena-store';
import { localPlayerStore } from '@/state/stores/local-player-store';
import { matchStore } from '@/state/stores/match-store';
import type { MoveCommand } from '@/types/arena';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { KmTimeCountdown } from '@kokimoki/shared';
import {
	ArrowUp,
	Check,
	Clock,
	Crosshair,
	Heart,
	RotateCcw,
	RotateCw,
	Trash2,
	X
} from 'lucide-react';
import * as React from 'react';

/** Command configuration with icon and label */
const COMMANDS: {
	id: MoveCommand;
	icon: React.ReactNode;
	label: string;
	color: string;
}[] = [
	{
		id: 'move-forward',
		icon: <ArrowUp className="h-6 w-6" />,
		label: config.commandMoveForward,
		color:
			'text-neon-cyan border-neon-cyan/60 bg-neon-cyan/10 hover:bg-neon-cyan/20'
	},
	{
		id: 'rotate-left',
		icon: <RotateCcw className="h-6 w-6" />,
		label: config.commandRotateLeft,
		color:
			'text-neon-fuchsia border-neon-fuchsia/60 bg-neon-fuchsia/10 hover:bg-neon-fuchsia/20'
	},
	{
		id: 'rotate-right',
		icon: <RotateCw className="h-6 w-6" />,
		label: config.commandRotateRight,
		color:
			'text-neon-fuchsia border-neon-fuchsia/60 bg-neon-fuchsia/10 hover:bg-neon-fuchsia/20'
	},
	{
		id: 'shoot',
		icon: <Crosshair className="h-6 w-6" />,
		label: config.commandShoot,
		color:
			'text-neon-rose border-neon-rose/60 bg-neon-rose/10 hover:bg-neon-rose/20'
	}
];

/** Get command config by ID */
const getCommandConfig = (id: MoveCommand) => COMMANDS.find((c) => c.id === id);

/**
 * Programming view for players to program their robot's moves
 */
export const ProgrammingView: React.FC = () => {
	const { draftProgram, hasSubmitted } = useSnapshot(localPlayerStore.proxy);
	const { phaseStartTimestamp, programmingDuration, currentRound } =
		useSnapshot(matchStore.proxy);
	const { robots, gridSize } = useSnapshot(arenaStore.proxy);

	const serverTime = useServerTimer(100);
	const myRobot = robots[kmClient.id];

	// Calculate remaining time
	const elapsedMs = serverTime - phaseStartTimestamp;
	const totalMs = programmingDuration * 1000;
	const remainingMs = Math.max(0, totalMs - elapsedMs);
	const isUrgent = remainingMs < 10000;
	const showShrinkWarning = willArenaShrinkNextRound(currentRound, gridSize);

	const handleAddCommand = async (command: MoveCommand) => {
		if (!myRobot || hasSubmitted || draftProgram.length >= 5) return;
		await localPlayerActions.addCommand(command);
	};

	const handleRemoveCommand = async (index: number) => {
		if (!myRobot || hasSubmitted) return;
		await localPlayerActions.removeCommand(index);
	};

	const handleClearProgram = async () => {
		if (!myRobot || hasSubmitted) return;
		await localPlayerActions.clearProgram();
	};

	const handleSubmit = async () => {
		if (!myRobot || hasSubmitted) return;
		await matchActions.submitProgram(draftProgram);
		await localPlayerActions.setSubmitted(true);
	};

	return (
		<div className="animate-fade-in-up flex w-full max-w-md flex-col items-center gap-6 sm:max-w-lg">
			{/* Header with timer and lives */}
			<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{/* Lives display */}
				{myRobot && (
					<div className="flex w-full items-center justify-between gap-2 rounded-sm border border-slate-700 bg-slate-800/60 px-3 py-2 sm:w-auto sm:justify-start">
						<span className="text-sm text-slate-500">{config.livesLabel}</span>
						<div className="flex gap-1">
							{Array.from({ length: 3 }).map((_, i) => (
								<Heart
									key={i}
									className={cn(
										'h-5 w-5 transition-all duration-300',
										i < myRobot.lives
											? 'text-neon-rose drop-shadow-[0_0_4px_currentColor]'
											: 'text-slate-700'
									)}
									fill={i < myRobot.lives ? 'currentColor' : 'none'}
								/>
							))}
						</div>
					</div>
				)}

				{/* Timer */}
				<div
					className={cn(
						'font-display flex w-full items-center justify-center gap-2 rounded-sm border-2 px-4 py-2 text-2xl sm:w-auto',
						isUrgent
							? 'animate-neon-pulse border-neon-rose/60 bg-neon-rose/10 text-neon-rose shadow-[0_0_15px_var(--color-neon-rose)/0.2]'
							: 'border-neon-cyan/50 bg-neon-cyan/5 text-neon-cyan'
					)}
				>
					<Clock className="h-5 w-5" />
					<KmTimeCountdown ms={remainingMs} />
				</div>
			</div>

			{showShrinkWarning && (
				<div className="border-neon-rose/60 bg-neon-rose/10 w-full rounded-sm border-2 px-4 py-3 shadow-[0_0_12px_var(--color-neon-rose)/0.15]">
					<p className="font-display text-neon-rose text-sm tracking-wide uppercase">
						{config.hazardShrinkWarningTitle}
					</p>
					<p className="font-mono text-sm text-slate-300">
						{config.hazardShrinkWarningMessage}
					</p>
				</div>
			)}

			{/* Title */}
			<h2 className="font-display neon-text-glow-sm text-neon-cyan text-xl tracking-wider uppercase">
				{config.programmingPhaseTitle}
			</h2>

			{/* Timeline slots */}
			<div className="grid w-full grid-cols-5 gap-2 overflow-x-clip">
				{Array.from({ length: 5 }).map((_, index) => {
					const command = draftProgram[index];
					const commandConfig = command ? getCommandConfig(command) : null;

					return (
						<div
							key={index}
							className={cn(
								'command-slot relative flex h-20 flex-1 flex-col items-center justify-center rounded-sm border-2 transition-all',
								commandConfig
									? cn(commandConfig.color, 'animate-slot-fill')
									: 'border-dashed border-slate-700 bg-slate-800/30'
							)}
						>
							{commandConfig ? (
								<>
									{commandConfig.icon}
									<span className="mt-1 font-mono text-xs opacity-60">
										{index + 1}
									</span>
									{!hasSubmitted && (
										<button
											type="button"
											onClick={() => handleRemoveCommand(index)}
											className="absolute top-1 right-1 rounded-full border border-slate-600 bg-slate-800 p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
										>
											<X className="h-3 w-3" />
										</button>
									)}
								</>
							) : (
								<span className="font-mono text-slate-700">{index + 1}</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Command palette */}
			{!hasSubmitted && (
				<div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
					{COMMANDS.map((command) => (
						<button
							key={command.id}
							type="button"
							onClick={() => handleAddCommand(command.id)}
							disabled={draftProgram.length >= 5}
							className={cn(
								'command-slot flex flex-col items-center justify-center rounded-sm border-2 p-3 transition-all',
								command.color,
								'disabled:cursor-not-allowed disabled:opacity-40'
							)}
						>
							{command.icon}
							<span className="mt-1 font-mono text-xs uppercase">
								{command.label}
							</span>
						</button>
					))}
				</div>
			)}

			{/* Actions */}
			<div className="flex w-full flex-col gap-3 sm:flex-row">
				{!hasSubmitted ? (
					<>
						<button
							type="button"
							onClick={handleClearProgram}
							disabled={draftProgram.length === 0}
							className="km-btn-secondary flex-1"
						>
							<Trash2 className="h-5 w-5" />
							{config.clearButton}
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							className="km-btn-primary flex-1"
						>
							<Check className="h-5 w-5" />
							{config.submitButton}
						</button>
					</>
				) : (
					<div className="border-neon-lime/50 bg-neon-lime/10 text-neon-lime flex w-full flex-col items-center gap-2 rounded-sm border-2 p-4 shadow-[0_0_15px_var(--color-neon-lime)/0.15]">
						<Check className="animate-float h-8 w-8" />
						<span className="font-display neon-text-glow-sm font-medium tracking-widest uppercase">
							{config.submittedMessage}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};
