import { config } from '@/config';
import { cn } from '@/utils/cn';

interface LogoProps {
	className?: string;
}

/**
 * Retro robot-style logo for Code-A-Bot Arena
 */
export function Logo({ className }: LogoProps) {
	return (
		<div
			className={cn(
				'border-neon-cyan/80 text-neon-cyan neon-text-glow-sm font-display inline-flex items-center gap-2 rounded-sm border-2 bg-slate-900/90 px-3 py-1.5 text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-sm',
				className
			)}
		>
			<span className="text-neon-cyan/40">&lt;</span>
			<span>{config.logoText}</span>
			<span className="text-neon-cyan/40">/&gt;</span>
		</div>
	);
}
