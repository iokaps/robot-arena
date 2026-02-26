# Changelog

All notable changes to this project will be documented in this file.

## 0.2.6 - 2026-02-26

### Fixed

- Prevented robot overlap when simultaneous movement or conveyor pushes resolve to conflicting destinations.
- Hardened program handling so malformed, missing, or partially empty submissions no longer break execution.

### Changed

- Removed the player-facing `Wait` command button from the programming palette.
- Players can now leave timeline slots empty; empty slots execute as no-op behavior.
- Updated game documentation and host guide wording to reflect "up to 5 moves" and empty-slot behavior.
- Locked arena size to a fixed 14×14 grid and removed host size selection controls.
- Enforced an explicit match player range of 2-10 for the fixed arena.
- Added reconnect recovery improvements: presenter QR availability during gameplay and same-name seat reclaim for disconnected players.
