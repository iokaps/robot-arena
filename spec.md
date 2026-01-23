# Code-A-Bot Arena - Game Specification

## Overview

A turn-based strategy game where players "program" their robot's moves during a planning phase, then watch all robots execute their programs simultaneously on a shared arena. The chaos emerges from collisions, misfired shots, and timing mismatches.

## Game Flow

1. **Lobby Phase**: Players join and wait for host to start
2. **Programming Phase** (30 seconds): Each player programs 5 moves for their robot
3. **Execution Phase**: All robots execute their programs simultaneously, one move at a time
4. **Repeat** rounds 2-3 until one robot remains or all are eliminated
5. **Results Phase**: Display winner and final standings

## Arena

### Grid

- **Size**: 10x10 cells
- **Coordinate System**: (0,0) at top-left, x increases right, y increases down

### Obstacles

- Static cells that block movement and shots
- 2-3 pre-defined map layouts:
  - **Open Arena**: Minimal obstacles, 4 corner blocks
  - **Cross**: Cross-shaped obstacle pattern in center
  - **Maze**: Scattered obstacles creating corridors

### Spawning

- **≤4 players**: Fixed corner positions (0,0), (9,0), (0,9), (9,9)
- **>4 players**: Random placement on empty cells, minimum 3 cells apart

## Robots

### Properties

- **Position**: (x, y) grid coordinates
- **Rotation**: 0° (up), 90° (right), 180° (down), 270° (left)
- **Lives**: 3 (eliminated at 0)
- **Color**: Auto-assigned from palette (cyan, fuchsia, lime, orange, rose, violet)

### Commands

| Command      | Icon | Effect                                  |
| ------------ | ---- | --------------------------------------- |
| Move Forward | ↑    | Move 1 cell in facing direction         |
| Rotate Left  | ↺    | Turn 90° counter-clockwise              |
| Rotate Right | ↻    | Turn 90° clockwise                      |
| Shoot        | ⊕    | Fire hit-scan laser in facing direction |
| Wait         | ◷    | Do nothing this tick                    |

## Execution Rules

### Move Resolution Order (per tick)

1. **Rotation**: All rotations applied simultaneously
2. **Movement**: All movements attempted simultaneously
3. **Shooting**: All shots fired simultaneously
4. **Damage**: Apply damage from shots

### Collision Rules

- **Wall/Obstacle**: Robot stays in place, move cancelled
- **Robot vs Robot** (same destination): Both robots stay in original positions
- **Head-on collision** (swapping positions): Both stay in original positions

### Shooting Mechanics

- **Type**: Hit-scan (instant)
- **Range**: Infinite until hitting obstacle or edge
- **Damage**: 1 life per hit
- **Penetration**: Stops at first robot hit

### Elimination

- Robot with 0 lives is eliminated
- Eliminated robots removed from arena
- Eliminated players see "You're out!" screen
- Their programmed moves for remaining ticks are skipped

## Win Conditions

- **Last Standing**: Final robot alive wins
- **Draw**: If last robots eliminate each other simultaneously
- **Timeout**: After 10 rounds with no winner, most lives wins (tiebreaker: most damage dealt)

## Player Interface

### Programming View

- 5-slot horizontal timeline
- Command palette with tap-to-add
- Drag to reorder moves
- Clear all / undo buttons
- Countdown timer (pulses red when <10s)
- Own lives display
- Submit button (locks in moves)

### Spectating View (during execution)

- Full arena view
- Highlight own robot
- Shot trails and hit effects

### Eliminated View

- "You're out!" message with glitch effect
- Stats: rounds survived, damage dealt
- Watch remaining match

## Host Controls

- Map selection dropdown
- Start match / Reset buttons
- Phase indicator
- Player list with lives overview

## Presenter Display

- Full-screen arena view
- QR code overlay during lobby
- Robot labels with player names
- Life counters for all robots
- Execution: ~1 second per tick with animations
- Shot trails (laser beams)
- Hit effects (flash on damaged robot)
- Elimination explosion animation
- Winner announcement overlay

## Timing

| Phase           | Duration                  |
| --------------- | ------------------------- |
| Programming     | 30 seconds (configurable) |
| Execution tick  | 1 second animation        |
| Results display | 5 seconds                 |

## Visual Theme

- **Background**: Dark slate (`slate-900`)
- **Grid lines**: Subtle neon glow
- **Robot colors**: Neon palette (cyan-400, fuchsia-500, lime-400, orange-400, rose-400, violet-400)
- **Obstacles**: Dark with accent borders
- **Effects**: Glow, pulse animations, laser trails
