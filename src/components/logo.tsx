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
				'border-neon-cyan text-neon-cyan neon-text-glow inline-flex items-center gap-2 border-2 bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold tracking-widest uppercase',
				className
			)}
		>
			<span className="text-slate-500">[</span>
			<span>{config.logoText}</span>
			<span className="text-slate-500">]</span>
		</div>
	);
}
