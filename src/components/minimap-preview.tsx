import { generateLayoutTerrain } from '@/state/actions/arena-actions';
import type { MapLayoutId, Position, TerrainCell } from '@/types/arena';
import { cn } from '@/utils/cn';
import { ChevronUp, Skull } from 'lucide-react';
import * as React from 'react';

interface MinimapPreviewProps {
	/** The map layout to preview */
	layoutId: MapLayoutId;
	/** Grid dimensions */
	gridSize: { width: number; height: number };
	/** Cell size in pixels (default: 10) */
	cellSize?: number;
	/** Maximum width in pixels (default: 200) */
	maxWidth?: number;
	/** Optional className */
	className?: string;
}

/**
 * Minimap preview component showing a layout without robots.
 * Used for previewing map layouts in host controls.
 */
export const MinimapPreview: React.FC<MinimapPreviewProps> = ({
	layoutId,
	gridSize,
	cellSize: preferredCellSize = 10,
	maxWidth = 200,
	className
}) => {
	// Generate terrain for preview (no spawn zones needed)
	const { obstacles, terrain } = React.useMemo(
		() => generateLayoutTerrain(layoutId, gridSize, 0.12, []),
		[layoutId, gridSize]
	);

	// Calculate responsive cell size
	const maxDimension = Math.max(gridSize.width, gridSize.height);
	const cellSize = Math.min(
		preferredCellSize,
		Math.floor(maxWidth / maxDimension)
	);

	const gridWidth = gridSize.width * cellSize;
	const gridHeight = gridSize.height * cellSize;

	return (
		<div
			className={cn(
				'bg-arena-bg relative overflow-hidden rounded-lg border border-slate-600',
				className
			)}
			style={{ width: gridWidth, height: gridHeight }}
		>
			{/* Grid lines */}
			<svg
				className="pointer-events-none absolute inset-0 opacity-30"
				width={gridWidth}
				height={gridHeight}
			>
				{Array.from({ length: gridSize.width + 1 }).map((_, i) => (
					<line
						key={`v-${i}`}
						x1={i * cellSize}
						y1={0}
						x2={i * cellSize}
						y2={gridHeight}
						className="stroke-arena-grid"
						strokeWidth={0.5}
					/>
				))}
				{Array.from({ length: gridSize.height + 1 }).map((_, i) => (
					<line
						key={`h-${i}`}
						x1={0}
						y1={i * cellSize}
						x2={gridWidth}
						y2={i * cellSize}
						className="stroke-arena-grid"
						strokeWidth={0.5}
					/>
				))}
			</svg>

			{/* Terrain (pits and conveyors) */}
			{Object.values(terrain).map((cell: TerrainCell) => (
				<TerrainCellMini
					key={`terrain-${cell.position.x}-${cell.position.y}`}
					terrain={cell}
					cellSize={cellSize}
				/>
			))}

			{/* Obstacles (walls) */}
			{Object.values(obstacles).map((pos: Position) => (
				<div
					key={`obstacle-${pos.x}-${pos.y}`}
					className="bg-arena-obstacle absolute rounded-sm border border-slate-600/50"
					style={{
						left: pos.x * cellSize + 1,
						top: pos.y * cellSize + 1,
						width: cellSize - 2,
						height: cellSize - 2
					}}
				/>
			))}
		</div>
	);
};

/** Simplified terrain cell for minimap */
const TerrainCellMini: React.FC<{
	terrain: TerrainCell;
	cellSize: number;
}> = ({ terrain, cellSize }) => {
	if (terrain.type === 'pit') {
		return (
			<div
				className="absolute flex items-center justify-center rounded-sm bg-gradient-to-br from-red-950 to-red-900"
				style={{
					left: terrain.position.x * cellSize + 1,
					top: terrain.position.y * cellSize + 1,
					width: cellSize - 2,
					height: cellSize - 2
				}}
			>
				{cellSize >= 8 && (
					<Skull
						className="text-red-500/60"
						style={{ width: cellSize * 0.6, height: cellSize * 0.6 }}
					/>
				)}
			</div>
		);
	}

	if (terrain.type === 'conveyor') {
		const rotation = terrain.direction ?? 0;
		return (
			<div
				className="absolute flex items-center justify-center rounded-sm bg-amber-900/50"
				style={{
					left: terrain.position.x * cellSize + 1,
					top: terrain.position.y * cellSize + 1,
					width: cellSize - 2,
					height: cellSize - 2
				}}
			>
				{cellSize >= 6 && (
					<ChevronUp
						className="text-amber-400/70"
						style={{
							width: cellSize * 0.6,
							height: cellSize * 0.6,
							transform: `rotate(${rotation}deg)`
						}}
					/>
				)}
			</div>
		);
	}

	return null;
};
