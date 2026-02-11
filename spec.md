# Code-A-Bot Arena - Game Specification

## Overview

A turn-based strategy game where players "program" their robot's moves during a planning phase, then watch all robots execute their programs simultaneously on a shared arena. The chaos emerges from collisions, misfired shots, and timing mismatches.

## Game Flow

1. **Lobby Phase**: Players join and wait for host to start
2. **Programming Phase** (60 seconds): Each player programs 5 moves for their robot
3. **Execution Phase**: All robots execute their programs simultaneously, one move at a time
4. **Repeat** rounds 2-3 until one robot remains or all are eliminated
5. **Results Phase**: Display winner and final standings

## Arena

### Grid

- **Dynamic Size**: Scales based on player count
  - **Small (2-4 players)**: 10×10 cells
  - **Medium (5-8 players)**: 14×14 cells
  - **Large (9-12 players)**: 18×18 cells
  - **Mega (13+ players)**: 22×22 cells
- **Size Selection**: Host can choose "Auto" (recommended) or manually select a size
- **Coordinate System**: (0,0) at top-left, x increases right, y increases down

### Obstacles

- Dynamic density based on arena size (10-15%)
- Obstacles avoid spawn zones (2-cell buffer around spawns)
- Impassable by movement and block lasers

### Terrain Types

| Type     | Visual      | Effect                                                |
| -------- | ----------- | ----------------------------------------------------- |
| Wall     | Dark block  | Blocks movement and lasers                            |
| Pit      | Red + skull | Instant death when standing on it                     |
| Conveyor | Amber arrow | Pushes robot 1 cell in arrow direction at end of tick |

### Map Layouts

- **Open Arena**: Scattered corner obstacles, center cover on larger maps
- **Cross**: Cross-shaped obstacle pattern scaled to grid
- **Maze**: Random scattered obstacles based on density
- **Gauntlet**: Corridor with pits on sides, conveyors at ends
- **Factory**: Conveyor belt loop around center obstacles
- **Death Trap**: Checkered pits/walls with edge conveyors pushing inward

### Spawning

- **All players**: Distributed evenly around the inner perimeter (1 cell inside walls)
- Robots face toward center of arena
- Minimum spacing ensured by perimeter distribution
- Spawn positions avoid wall obstacles to ensure robots can move immediately

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
3. **Pickup Collection**: Robots standing on pickups collect them
4. **Shooting**: All shots fired simultaneously
5. **Damage**: Apply damage from shots (shields absorb first)
6. **Pit Death**: Robots standing on pits are eliminated
7. **Conveyor Push**: Conveyors push robots 1 cell (can push onto pits)

### Collision Rules

- **Wall/Obstacle**: Robot stays in place, move cancelled
- **Robot vs Robot** (same destination): Both robots stay in original positions
- **Head-on collision** (swapping positions): Both stay in original positions

### Shooting Mechanics

- **Type**: Hit-scan (instant)
- **Range**: Infinite until hitting obstacle or edge
- **Damage**: 1 life per hit (2 with Power Cell)
- **Penetration**: Stops at first robot hit

### Pickups

Collectible items that spawn on the arena and provide bonuses.

| Pickup      | Icon | Effect                                | Duration   |
| ----------- | ---- | ------------------------------------- | ---------- |
| Health Pack | ❤️   | Restore 1 life (max 3)                | Instant    |
| Shield      | 🛡️   | Block the next incoming hit           | Until hit  |
| Power Cell  | ⚡   | Next shot deals 2 damage instead of 1 | Single use |

**Spawn Rules:**

- 1-3 pickups spawn based on arena size (small=1, medium=2, large=3)
- New pickups spawn at the start of each round
- Pickups spawn in center region, avoiding walls, terrain, and robots
- Collected when a robot moves onto the pickup cell

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

### Player Footer

- Player name displayed with assigned robot color indicator (colored dot + colored name text)
- Color matches the robot on the presenter arena so players can identify themselves

### Lobby View (How It Works)

Displayed to players before the match starts:

- Welcome message with game title
- **How It Works** summary:
  1. 🤖 Each player controls a robot on a grid arena
  2. ⏱️ You have 60 seconds to program 5 moves
  3. ⚡ All robots execute their programs simultaneously
  4. 💥 Last bot standing wins!
- Command overview (Move, Rotate, Shoot, Wait)
- "Waiting for host to start" message

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
- Stats: rounds survived
- "Watch remaining bots battle it out" message

### Help Menu (accessible via menu icon)

Detailed instructions available in player menu:

- **Goal**: Be the last robot standing
- **Game Flow**: Programming phase → Execution phase → Repeat
- **Commands Table**: Move, Rotate Left/Right, Shoot, Wait
- **Terrain Hazards**: Pits (instant death), Conveyors (push each tick)
- **Rules**: 3 lives, collision behavior, laser blocking
- **Tips**: Predict opponents, use cover, watch for conveyors

## Host Controls

### Host Screen Features

- **Arena Size Selection**: Auto / Small / Medium / Large / Mega
- **Map Layout Selection**: Open / Cross / Maze / Gauntlet / Factory / Death Trap
- **Minimap Preview**: Visual preview of selected layout at actual arena size
- **Player Count**: Shows joined players with minimum requirement (2+)
- **Match Controls**: Start Match / Reset Match buttons
- **QR Toggle**: Show/hide QR code on presenter screen
- **Phase Indicator**: Current phase with round number
- **Robot Status** (during match): Player names with life hearts

### How to Host Guide

1. Share the Player Link or QR code with participants
2. Wait for players to join (minimum 2 players required)
3. Select arena size (Auto recommended scales with player count)
4. Choose map layout using minimap preview to see terrain
5. Click "Start Match" when ready

### Arena Options

| Size   | Grid  | Players |
| ------ | ----- | ------- |
| Small  | 10×10 | 2-4     |
| Medium | 14×14 | 5-8     |
| Large  | 18×18 | 9-12    |
| Mega   | 22×22 | 13+     |

### Map Layouts

| Layout     | Description                                     |
| ---------- | ----------------------------------------------- |
| Open       | Minimal obstacles, corner cover                 |
| Cross      | Cross-shaped walls for tactical play            |
| Maze       | Random scattered obstacles                      |
| Gauntlet   | Corridor with pit hazards, conveyor ends        |
| Factory    | Conveyor belt loop, central walls               |
| Death Trap | Checkered pits/walls, edge conveyors pushing in |

## Presenter Display

- Full-screen arena view
- QR code overlay during lobby
- **Animated player roster**: Player names appear with staggered fade-in animation as they join during lobby
- Robot labels with player names
- Life counters for all robots
- Execution: ~1 second per tick with animations
- Shot trails (laser beams)
- Hit effects (flash on damaged robot)
- Elimination explosion animation
- Winner announcement overlay
- **Confetti celebration**: Massive confetti animation on winner screens (player + presenter), no confetti on draws

## Timing

| Phase           | Duration                  |
| --------------- | ------------------------- |
| Programming     | 60 seconds (configurable) |
| Execution tick  | 1.2 seconds animation     |
| Results display | 5 seconds                 |

## Visual Theme

- **Background**: Dark slate (`slate-900`)
- **Grid lines**: Subtle neon glow
- **Robot colors**: Neon palette (cyan-400, fuchsia-500, lime-400, orange-400, rose-400, violet-400)
- **Obstacles**: Dark with accent borders
- **Pits**: Red gradient with skull icon
- **Conveyors**: Amber with animated directional arrow
- **Effects**: Glow, pulse animations, laser trails
