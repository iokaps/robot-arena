import type { RobotColor } from '@/types/arena';
import { cn } from '@/utils/cn';
import * as React from 'react';

/** Color values for SVG fills */
const COLOR_VALUES: Record<
	RobotColor,
	{ primary: string; secondary: string; glow: string }
> = {
	cyan: {
		primary: 'oklch(0.78 0.14 200)',
		secondary: 'oklch(0.55 0.1 200)',
		glow: 'oklch(0.88 0.16 200)'
	},
	fuchsia: {
		primary: 'oklch(0.68 0.18 340)',
		secondary: 'oklch(0.48 0.14 340)',
		glow: 'oklch(0.8 0.2 340)'
	},
	lime: {
		primary: 'oklch(0.82 0.2 145)',
		secondary: 'oklch(0.6 0.16 145)',
		glow: 'oklch(0.9 0.22 145)'
	},
	orange: {
		primary: 'oklch(0.72 0.18 55)',
		secondary: 'oklch(0.5 0.14 55)',
		glow: 'oklch(0.85 0.2 55)'
	},
	rose: {
		primary: 'oklch(0.65 0.2 20)',
		secondary: 'oklch(0.45 0.16 20)',
		glow: 'oklch(0.78 0.22 20)'
	},
	violet: {
		primary: 'oklch(0.6 0.15 280)',
		secondary: 'oklch(0.4 0.12 280)',
		glow: 'oklch(0.75 0.18 280)'
	}
};

interface ChibiRobotProps {
	color: RobotColor;
	size: number;
	hasShield?: boolean;
	isHighlighted?: boolean;
	isBroken?: boolean;
	className?: string;
}

/**
 * Cute chibi-style robot SVG component with a faceless chassis,
 * shield bubble, and broken state.
 */
export const ChibiRobot: React.FC<ChibiRobotProps> = ({
	color,
	size,
	hasShield = false,
	isHighlighted = false,
	isBroken = false,
	className
}) => {
	const colors = COLOR_VALUES[color];
	// Extended viewBox to accommodate direction arrow above robot
	// viewBox starts at y=-20 to give space for the arrow indicator
	const viewBoxMinY = -20;
	const viewBoxHeight = 120;
	const viewBoxWidth = 100;

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
			className={cn(
				'will-change-transform',
				isBroken && 'animate-chibi-broken',
				!isBroken && 'animate-chibi-idle',
				className
			)}
			style={{
				filter: isBroken
					? 'grayscale(60%)'
					: isHighlighted
						? `drop-shadow(0 0 6px ${colors.glow})`
						: undefined,
				transform: isBroken ? 'rotate(8deg)' : undefined
			}}
		>
			<defs>
				{/* Shield bubble gradient */}
				<radialGradient id={`shield-${color}`} cx="30%" cy="30%">
					<stop offset="0%" stopColor={colors.glow} stopOpacity="0.3" />
					<stop offset="70%" stopColor={colors.primary} stopOpacity="0.15" />
					<stop offset="100%" stopColor={colors.primary} stopOpacity="0.4" />
				</radialGradient>

				{/* Arrow glow filter */}
				<filter
					id={`arrowGlow-${color}`}
					x="-50%"
					y="-50%"
					width="200%"
					height="200%"
				>
					<feDropShadow
						dx="0"
						dy="0"
						stdDeviation="2"
						floodColor={colors.glow}
						floodOpacity="0.8"
					/>
				</filter>
			</defs>

			{/* Direction arrow indicator (above robot) */}
			{!isBroken && (
				<g className="animate-arrow-pulse">
					<polygon
						points="50,-15 36,6 43,6 43,16 57,16 57,6 64,6"
						fill={colors.glow}
						filter={`url(#arrowGlow-${color})`}
					/>
					{/* Arrow outline for definition */}
					<polygon
						points="50,-15 36,6 43,6 43,16 57,16 57,6 64,6"
						fill="none"
						stroke={colors.secondary}
						strokeWidth="1.5"
						strokeOpacity="0.6"
					/>
				</g>
			)}

			{/* Shield bubble dome (behind robot) */}
			{hasShield && (
				<ellipse
					cx="50"
					cy="52"
					rx="46"
					ry="44"
					fill={`url(#shield-${color})`}
					stroke={colors.primary}
					strokeWidth="2"
					strokeDasharray="4 2"
					className="animate-shield-bubble"
				/>
			)}

			{/* Antenna */}
			<g className={!isBroken ? 'animate-antenna-bob' : undefined}>
				{/* Antenna stem */}
				<rect
					x="47"
					y="8"
					width="6"
					height="12"
					fill="oklch(0.3 0.01 240)"
					rx="2"
				/>
				{/* Antenna ball */}
				<circle
					cx="50"
					cy="6"
					r="5"
					fill={isBroken ? 'oklch(0.3 0.01 240)' : colors.primary}
					stroke="oklch(0.25 0.01 240)"
					strokeWidth="1"
				/>
				{/* Antenna glow */}
				{!isBroken && (
					<circle cx="48" cy="4" r="1.5" fill={colors.glow} opacity="0.8" />
				)}
			</g>

			{/* Robot body (pill shape) */}
			<rect
				x="20"
				y="20"
				width="60"
				height="55"
				rx="16"
				ry="16"
				fill={colors.primary}
				stroke={colors.secondary}
				strokeWidth="3"
			/>

			{/* Body panel lines */}
			<rect
				x="25"
				y="50"
				width="50"
				height="3"
				fill={colors.secondary}
				opacity="0.5"
				rx="1"
			/>
			<rect
				x="30"
				y="56"
				width="40"
				height="2"
				fill={colors.secondary}
				opacity="0.3"
				rx="1"
			/>

			{/* Arm nubs */}
			<ellipse
				cx="12"
				cy="45"
				rx="8"
				ry="10"
				fill={colors.secondary}
				stroke={colors.primary}
				strokeWidth="2"
			/>
			<ellipse
				cx="88"
				cy="45"
				rx="8"
				ry="10"
				fill={colors.secondary}
				stroke={colors.primary}
				strokeWidth="2"
			/>

			{/* Arm highlights */}
			<ellipse
				cx="10"
				cy="42"
				rx="3"
				ry="4"
				fill={colors.primary}
				opacity="0.6"
			/>
			<ellipse
				cx="86"
				cy="42"
				rx="3"
				ry="4"
				fill={colors.primary}
				opacity="0.6"
			/>

			{/* Track/wheel base */}
			<rect
				x="22"
				y="72"
				width="56"
				height="18"
				rx="6"
				fill="oklch(0.25 0.01 240)"
				stroke="oklch(0.3 0.01 240)"
				strokeWidth="2"
			/>

			{/* Track treads */}
			<rect
				x="26"
				y="76"
				width="4"
				height="10"
				fill="oklch(0.35 0.01 240)"
				rx="1"
			/>
			<rect
				x="34"
				y="76"
				width="4"
				height="10"
				fill="oklch(0.35 0.01 240)"
				rx="1"
			/>
			<rect
				x="42"
				y="76"
				width="4"
				height="10"
				fill="oklch(0.35 0.01 240)"
				rx="1"
			/>
			<rect
				x="50"
				y="76"
				width="4"
				height="10"
				fill="oklch(0.35 0.01 240)"
				rx="1"
			/>
			<rect
				x="58"
				y="76"
				width="4"
				height="10"
				fill="oklch(0.35 0.01 240)"
				rx="1"
			/>
			<rect
				x="66"
				y="76"
				width="4"
				height="10"
				fill="oklch(0.35 0.01 240)"
				rx="1"
			/>

			{/* Broken state extras */}
			{isBroken && (
				<g>
					{/* Crack lines */}
					<path
						d="M35,25 L40,35 L35,45 L42,50"
						fill="none"
						stroke="oklch(0.15 0.01 240)"
						strokeWidth="2"
						strokeLinecap="round"
					/>
					<path
						d="M65,28 L60,38 L68,48"
						fill="none"
						stroke="oklch(0.15 0.01 240)"
						strokeWidth="2"
						strokeLinecap="round"
					/>

					{/* Smoke wisps */}
					<path
						d="M40,5 Q38,0 42,-2 Q40,-5 44,-6"
						fill="none"
						stroke="oklch(0.5 0.01 240)"
						strokeWidth="2"
						strokeLinecap="round"
						opacity="0.6"
					/>
					<path
						d="M55,3 Q58,-2 54,-5 Q58,-7 55,-10"
						fill="none"
						stroke="oklch(0.5 0.01 240)"
						strokeWidth="2"
						strokeLinecap="round"
						opacity="0.5"
					/>
					<path
						d="M48,1 Q45,-3 50,-5"
						fill="none"
						stroke="oklch(0.45 0.01 240)"
						strokeWidth="1.5"
						strokeLinecap="round"
						opacity="0.4"
					/>
				</g>
			)}
		</svg>
	);
};
