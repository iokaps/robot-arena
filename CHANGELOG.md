# Changelog

All notable changes to this project will be documented in this file.

## 0.3.5 - 2026-03-19

### Release Summary

Fixed-layout update focused on cleaner match flow, stricter 2-10 active player handling, improved reconnect behavior, better mobile/presenter rendering, and more readable end-of-match results. This release also removes map voting, redesigns robots with a faceless chassis look, and upgrades hazard and timeout resolution.

### Player-Facing Changes

- The game now uses a single fixed `Open Arena` layout; map voting and host map overrides are no longer part of the flow.
- Shrink hazards now warn players in advance, damage robots over time on skull tiles, and eventually collapse the arena to one final safe cell.
- Round-limit endings are clearer: the game can now resolve by remaining lives, then total damage dealt, or end in a draw if still tied.
- Player and presenter results screens now show richer ending states, including timeout messaging and final standings when needed.
- Presenter and player spectating views render laser shots from actual execution events, improving shot accuracy during playback.
- Pilot names are now limited to 7 characters.
- Mobile and iOS layout issues were fixed to prevent arena and programming UI cut-off.
- Reconnect recovery was improved so offline players can reclaim their robot by rejoining with the same pilot name.
- Host, lobby, and results copy were updated to reflect the fixed arena, pickups, timeout rules, and the 2-10 active player limit.
- Robot visuals now use a faceless chassis design, with damage communicated through life indicators instead of facial expressions.

### Technical Changes

- Match execution now ends immediately when a tick leaves zero or one robots alive instead of always waiting for the full sequence to finish.
- Active-player filtering was tightened so the lobby cap is enforced against currently active online players, preventing freeze cases when more than 10 players connect.
- Shot visualization now uses recorded execution events instead of inferring fire actions from queued programs.
- Added timeout-result infrastructure, including result reasons, result copy helpers, standings calculation, and a reusable standings breakdown component.
- Added shrink-hazard damage feedback with robot pulse effects.
- Removed alternate map layouts and the related voting/override code paths from host, player, and presenter flows.

### GitHub Release Summary

- Fixed the arena flow around active-player limits, reconnect reclaim, and early match-ending logic.
- Removed map voting and standardized the build on a single `Open Arena` layout.
- Improved hazards with pre-shrink warnings, damage-over-time skull tiles, and a final-collapse safe cell.
- Improved end-of-match clarity with timeout verdicts, damage tiebreakers, and final standings.
- Fixed shot playback accuracy and several mobile/iOS presenter sizing and cut-off issues.
- Updated robot visuals to a faceless chassis style.

### Commit-by-Commit Summary

- `f139adf` - `2026-03-02` - Aligned host, presenter, and config copy around the `2-10` active-player limit and updated lobby/profile messaging to reflect match capacity.
- `6513a53` - `2026-03-02` - Reduced the game to a single `Open Arena` map and removed the practical need for multi-map selection.
- `5f12c3d` - `2026-03-05` - Reworked shrink hazards to deal damage over time instead of instant death, added pre-shrink warnings, and added hazard-damage pulse feedback in arena and gameplay views.
- `983a2a5` - `2026-03-09` - Removed map voting from the player flow and prevented invalid actions such as shooting while dead; also improved winning-screen behavior.
- `f3c43a4` - `2026-03-12` - Limited pilot names to 7 characters and updated related UI and spec text.
- `af8f082` - `2026-03-16` - Fixed lobby/full-match edge cases when more than 10 players joined and improved reconnect and active-player handling.
- `c5997d5` - `2026-03-16` - Fixed iOS/mobile layout issues affecting the player programming experience.
- `dde9ac0` - `2026-03-17` - Removed expressive robot faces and switched to the faceless chassis presentation.
- `bd8e55d` - `2026-03-19` - Fixed arena cut-off issues and improved match endings with timeout verdicts, standings breakdown, and final-result presentation.

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
