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

- **Fixed Size**: 14×14 cells
- **Player Range**: 2-10 players per match
- **Coordinate System**: (0,0) at top-left, x increases right, y increases down

### Obstacles

- Fixed density tuned for 14×14
- Obstacles avoid spawn zones (2-cell buffer around spawns)
- Impassable by movement and block lasers

### Terrain Types

| Type     | Visual      | Effect                                                 |
| -------- | ----------- | ------------------------------------------------------ |
| Wall     | Dark block  | Blocks movement and lasers                             |
| Pit      | Red + skull | Map pits eliminate instantly; shrink skulls drain life |
| Conveyor | Amber arrow | Pushes robot 1 cell in arrow direction at end of tick  |

### Hazard Escalation

- Safe area begins shrinking after Round 1
- A new hazard ring is added every N rounds (default: every 2 rounds), one cell further inward
- One round before a shrink event, a warning banner appears in player and presenter gameplay views
- Hazard rings are mostly pits with conveyors at side midpoints
- Hazard ring skull pits drain 1 life per tick while a robot remains on them
- Conveyors on hazard rings push robots toward the center

### Map Layouts

- **Open Arena**: Scattered corner obstacles, center cover on larger maps
- **Current build**: The arena layout is fixed to Open Arena to simplify validation and debugging

### Spawning

- **All players**: Distributed evenly around the inner perimeter (1 cell inside walls)
- **Capacity**: Match starts with 2-10 active players
- Robots face toward center of arena
- Minimum spacing ensured by perimeter distribution
- Spawn positions avoid wall obstacles to ensure robots can move immediately
- **Roster lock**: Player roster is locked when host starts a match
- **Lobby slots**: Before the host starts, only 10 currently connected players can hold lobby seats at once; a disconnected lobby player frees a slot for someone else to join
- **Late joiners**: Players joining after roster lock become spectators for current match and join next match
- **Reconnect reclaim**: If a disconnected player rejoins mid-match with the same pilot name and the previous seat is offline, their seat is reclaimed

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

Players can leave any timeline slot empty; empty slots do nothing on that tick.

## Execution Rules

### Move Resolution Order (per tick)

1. **Rotation**: All rotations applied simultaneously
2. **Movement**: All movements attempted simultaneously
3. **Pickup Collection**: Robots standing on pickups collect them
4. **Shooting**: All shots fired simultaneously
5. **Damage**: Apply damage from shots (shields absorb first)
6. **Pit Hazards**: Map pits eliminate instantly; shrink skull pits drain 1 life
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

- 2 pickups spawn each round on the 14×14 arena
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
- Pilot names are limited to 7 characters

### Lobby View (How It Works)

Displayed to players before the match starts:

- Welcome message with game title
- **How It Works** summary:
  1. 🤖 Each player controls a robot on a grid arena
  2. ⏱️ You have 60 seconds to program up to 5 moves
  3. ⚡ All robots execute their programs simultaneously
  4. 💥 Last bot standing wins!
- Command overview (Move, Rotate, Shoot; empty slots do nothing)
- "Waiting for host to start" message
- **Map layout preview**: Players see the fixed Open Arena minimap preview while waiting for the host

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
- **Commands Table**: Move, Rotate Left/Right, Shoot, Empty slot (no-op)
- **Terrain Hazards**: Map pits (instant death), shrink skulls (1 life decay per tick), Conveyors (push each tick)
- **Rules**: 3 lives, collision behavior, laser blocking
- **Tips**: Predict opponents, use cover, watch for conveyors

## Host Controls

### Host Screen Features

- **Map Layout Preview**: Open Arena preview shown before the match starts
- **Minimap Preview**: Visual preview of selected layout at actual arena size
- **Player Count**: Shows joined players with match range (2-10)
- **Match Controls**: Start Match / Reset Match buttons
- **Results Controls**: Rematch button starts a new match with the same locked roster and settings
- **QR Toggle**: Show/hide QR code on presenter screen
- **Phase Indicator**: Current phase with round number
- **Robot Status** (during match): Player names with life hearts

### How to Host Guide

1. Share the Player Link or QR code with participants
2. Wait for players to join (2-10 players per match)
3. Review the arena layout using the minimap preview
4. Click "Start Match" when ready

### Map Layouts

| Layout | Description                     |
| ------ | ------------------------------- |
| Open   | Minimal obstacles, corner cover |

## Presenter Display

- Full-screen arena view
- QR code overlay during lobby
- **Arena layout card**: Lobby shows the active Open Arena layout
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
