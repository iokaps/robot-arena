import { config } from '@/config';
import { cn } from '@/utils/cn';

interface LogoProps {
	className?: string;
}

/**
 * Example component demonstrating how to display the app logo.
 * Modify or replace with your own implementation.
 */
export function Logo({ className }: LogoProps) {
	return (
		<img
			src="https://static.kokimoki.com/gfc/v2/logo.svg"
			alt={config.title}
			title={config.title}
			className={cn('h-9', className)}
		/>
	);
}
