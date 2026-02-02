import type { RobotColor } from '@/types/arena';
import { cn } from '@/utils/cn';
import * as React from 'react';

/** Color values for SVG fills */
const COLOR_VALUES: Record<
	RobotColor,
	{ primary: string; secondary: string; glow: string }
> = {
	cyan: {
		primary: 'oklch(0.7 0.08 200)',
		secondary: 'oklch(0.5 0.06 200)',
		glow: 'oklch(0.8 0.1 200)'
	},
	fuchsia: {
		primary: 'oklch(0.6 0.12 45)',
		secondary: 'oklch(0.4 0.1 45)',
		glow: 'oklch(0.75 0.15 45)'
	},
	lime: {
		primary: 'oklch(0.75 0.15 145)',
		secondary: 'oklch(0.55 0.12 145)',
		glow: 'oklch(0.85 0.18 145)'
	},
	orange: {
		primary: 'oklch(0.65 0.15 55)',
		secondary: 'oklch(0.45 0.12 55)',
		glow: 'oklch(0.8 0.18 55)'
	},
	rose: {
		primary: 'oklch(0.6 0.15 25)',
		secondary: 'oklch(0.4 0.12 25)',
		glow: 'oklch(0.75 0.18 25)'
	},
	violet: {
		primary: 'oklch(0.55 0.08 280)',
		secondary: 'oklch(0.35 0.06 280)',
		glow: 'oklch(0.7 0.12 280)'
	}
};

interface ChibiRobotProps {
	color: RobotColor;
	lives: number;
	size: number;
	hasShield?: boolean;
	hasPowerBoost?: boolean;
	isHighlighted?: boolean;
	isBroken?: boolean;
	className?: string;
}

/** Render eye shapes based on color personality */
const EyeShape: React.FC<{
	color: RobotColor;
	lives: number;
	isBroken: boolean;
	hasPowerBoost: boolean;
	eyeColor: string;
	glowColor: string;
}> = ({ color, lives, isBroken, hasPowerBoost, eyeColor, glowColor }) => {
	// Broken state: X eyes for all
	if (isBroken) {
		return (
			<g>
				{/* Left X eye */}
				<line
					x1="28"
					y1="32"
					x2="36"
					y2="40"
					stroke={eyeColor}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<line
					x1="36"
					y1="32"
					x2="28"
					y2="40"
					stroke={eyeColor}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				{/* Right X eye */}
				<line
					x1="64"
					y1="32"
					x2="72"
					y2="40"
					stroke={eyeColor}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<line
					x1="72"
					y1="32"
					x2="64"
					y2="40"
					stroke={eyeColor}
					strokeWidth="3"
					strokeLinecap="round"
				/>
			</g>
		);
	}

	// Expression modifier based on lives
	const isWorried = lives === 1;
	const isNeutral = lives === 2;
	// lives === 3 is happy (default)

	// Power boost glow filter
	const filterUrl = hasPowerBoost ? 'url(#powerGlow)' : undefined;

	// Eye personalities by color
	switch (color) {
		case 'cyan':
			// Square LED eyes (classic bot)
			return (
				<g filter={filterUrl}>
					<rect
						x="26"
						y={isWorried ? '34' : '30'}
						width="12"
						height={isWorried ? '8' : '12'}
						fill={eyeColor}
						rx="1"
					/>
					<rect
						x="62"
						y={isWorried ? '34' : '30'}
						width="12"
						height={isWorried ? '8' : '12'}
						fill={eyeColor}
						rx="1"
					/>
					{/* Highlight */}
					<rect
						x="28"
						y={isWorried ? '35' : '31'}
						width="3"
						height="3"
						fill={glowColor}
						opacity="0.8"
					/>
					<rect
						x="64"
						y={isWorried ? '35' : '31'}
						width="3"
						height="3"
						fill={glowColor}
						opacity="0.8"
					/>
				</g>
			);

		case 'fuchsia':
			// Round dot eyes (friendly)
			return (
				<g filter={filterUrl}>
					<circle
						cx="32"
						cy={isWorried ? '38' : '36'}
						r={isWorried ? '5' : '7'}
						fill={eyeColor}
					/>
					<circle
						cx="68"
						cy={isWorried ? '38' : '36'}
						r={isWorried ? '5' : '7'}
						fill={eyeColor}
					/>
					{/* Highlight */}
					<circle
						cx="30"
						cy={isWorried ? '36' : '34'}
						r="2"
						fill={glowColor}
						opacity="0.8"
					/>
					<circle
						cx="66"
						cy={isWorried ? '36' : '34'}
						r="2"
						fill={glowColor}
						opacity="0.8"
					/>
					{isNeutral && (
						<>
							{/* Flat bottom for neutral expression */}
							<rect
								x="25"
								y="40"
								width="14"
								height="4"
								fill="oklch(0.2 0.01 240)"
							/>
							<rect
								x="61"
								y="40"
								width="14"
								height="4"
								fill="oklch(0.2 0.01 240)"
							/>
						</>
					)}
				</g>
			);

		case 'lime':
			// Visor-style single bar (cyclopean)
			return (
				<g filter={filterUrl}>
					<rect
						x="24"
						y={isWorried ? '35' : '32'}
						width="52"
						height={isWorried ? '6' : '10'}
						fill={eyeColor}
						rx="3"
					/>
					{/* Scanner effect */}
					<rect
						x="26"
						y={isWorried ? '36' : '33'}
						width="8"
						height={isWorried ? '4' : '8'}
						fill={glowColor}
						opacity="0.6"
						rx="2"
					/>
					{!isWorried && (
						<rect
							x="66"
							y="33"
							width="8"
							height="8"
							fill={glowColor}
							opacity="0.4"
							rx="2"
						/>
					)}
				</g>
			);

		case 'orange':
			// Triangle eyes (determined)
			return (
				<g filter={filterUrl}>
					{isWorried ? (
						<>
							{/* Narrowed angry eyes when worried */}
							<polygon points="26,40 38,40 32,34" fill={eyeColor} />
							<polygon points="62,40 74,40 68,34" fill={eyeColor} />
						</>
					) : (
						<>
							<polygon points="26,42 38,42 32,28" fill={eyeColor} />
							<polygon points="62,42 74,42 68,28" fill={eyeColor} />
							{/* Highlight */}
							<polygon
								points="30,38 34,38 32,32"
								fill={glowColor}
								opacity="0.6"
							/>
							<polygon
								points="66,38 70,38 68,32"
								fill={glowColor}
								opacity="0.6"
							/>
						</>
					)}
				</g>
			);

		case 'rose':
			// Heart-shaped eyes (cute)
			return (
				<g filter={filterUrl}>
					{isWorried ? (
						<>
							{/* Teary/squished hearts when worried */}
							<ellipse cx="32" cy="37" rx="6" ry="4" fill={eyeColor} />
							<ellipse cx="68" cy="37" rx="6" ry="4" fill={eyeColor} />
						</>
					) : (
						<>
							{/* Heart shapes made of circles + triangle */}
							<circle cx="29" cy="33" r="5" fill={eyeColor} />
							<circle cx="35" cy="33" r="5" fill={eyeColor} />
							<polygon points="24,35 40,35 32,45" fill={eyeColor} />

							<circle cx="65" cy="33" r="5" fill={eyeColor} />
							<circle cx="71" cy="33" r="5" fill={eyeColor} />
							<polygon points="60,35 76,35 68,45" fill={eyeColor} />

							{/* Highlights */}
							<circle cx="28" cy="32" r="2" fill={glowColor} opacity="0.7" />
							<circle cx="64" cy="32" r="2" fill={glowColor} opacity="0.7" />
						</>
					)}
				</g>
			);

		case 'violet':
			// Diamond eyes (mysterious)
			return (
				<g filter={filterUrl}>
					{isWorried ? (
						<>
							{/* Narrowed diamonds */}
							<polygon points="32,34 38,37 32,40 26,37" fill={eyeColor} />
							<polygon points="68,34 74,37 68,40 62,37" fill={eyeColor} />
						</>
					) : (
						<>
							<polygon points="32,28 40,36 32,44 24,36" fill={eyeColor} />
							<polygon points="68,28 76,36 68,44 60,36" fill={eyeColor} />
							{/* Inner glow */}
							<polygon
								points="32,32 36,36 32,40 28,36"
								fill={glowColor}
								opacity="0.5"
							/>
							<polygon
								points="68,32 72,36 68,40 64,36"
								fill={glowColor}
								opacity="0.5"
							/>
						</>
					)}
				</g>
			);

		default:
			return null;
	}
};

/**
 * Cute chibi-style robot SVG component with personality-based eyes,
 * expression states based on lives, shield bubble, and broken state.
 */
export const ChibiRobot: React.FC<ChibiRobotProps> = ({
	color,
	lives,
	size,
	hasShield = false,
	hasPowerBoost = false,
	isHighlighted = false,
	isBroken = false,
	className
}) => {
	const colors = COLOR_VALUES[color];
	const viewBoxSize = 100;

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
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
				{/* Power boost glow filter */}
				<filter id="powerGlow" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="2" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Shield bubble gradient */}
				<radialGradient id={`shield-${color}`} cx="30%" cy="30%">
					<stop offset="0%" stopColor={colors.glow} stopOpacity="0.3" />
					<stop offset="70%" stopColor={colors.primary} stopOpacity="0.15" />
					<stop offset="100%" stopColor={colors.primary} stopOpacity="0.4" />
				</radialGradient>
			</defs>

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

			{/* Face plate (darker area for eyes) */}
			<rect
				x="24"
				y="26"
				width="52"
				height="24"
				rx="4"
				fill="oklch(0.2 0.01 240)"
			/>

			{/* Eyes based on personality */}
			<EyeShape
				color={color}
				lives={lives}
				isBroken={isBroken}
				hasPowerBoost={hasPowerBoost}
				eyeColor={colors.glow}
				glowColor="#ffffff"
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

			{/* Direction indicator (chevron on chest) */}
			<polygon
				points="50,60 42,68 44,70 50,64 56,70 58,68"
				fill={colors.glow}
				opacity="0.8"
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
