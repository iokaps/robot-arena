import { config } from '@/config';

interface NameLabelProps {
	name: string;
}

/**
 * Example component demonstrating how to display the player's name.
 * Modify or replace with your own implementation.
 */
export function NameLabel({ name }: NameLabelProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-slate-500">{config.playerNameLabel}</span>
			<span className="font-semibold">{name}</span>
		</div>
	);
}
