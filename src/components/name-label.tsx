import { config } from '@/config';
import type { RobotColor } from '@/types/arena';
import { cn } from '@/utils/cn';

/** Color to Tailwind class mapping */
const COLOR_CLASSES: Record<RobotColor, { text: string; bg: string }> = {
	cyan: { text: 'text-neon-cyan', bg: 'bg-neon-cyan' },
	fuchsia: { text: 'text-neon-fuchsia', bg: 'bg-neon-fuchsia' },
	lime: { text: 'text-neon-lime', bg: 'bg-neon-lime' },
	orange: { text: 'text-neon-orange', bg: 'bg-neon-orange' },
	rose: { text: 'text-neon-rose', bg: 'bg-neon-rose' },
	violet: { text: 'text-neon-violet', bg: 'bg-neon-violet' }
};

interface NameLabelProps {
	name: string;
	/** Robot color to display as an indicator */
	robotColor?: RobotColor;
}

/**
 * Displays the player's name with an optional robot color indicator.
 */
export function NameLabel({ name, robotColor }: NameLabelProps) {
	const colorStyle = robotColor ? COLOR_CLASSES[robotColor] : null;

	return (
		<div className="flex items-center gap-2">
			{colorStyle && (
				<span
					className={cn(
						'h-3 w-3 rounded-full shadow-[0_0_6px_currentColor]',
						colorStyle.bg
					)}
				/>
			)}
			<span className="text-slate-600">{config.playerNameLabel}</span>
			<span
				className={cn(
					'neon-text-glow-sm font-display font-semibold tracking-wider uppercase',
					colorStyle ? colorStyle.text : 'text-neon-cyan'
				)}
			>
				{name}
			</span>
		</div>
	);
}
