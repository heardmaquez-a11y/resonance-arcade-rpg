# RESONANCE — The Balance of Worlds

A mobile-first 16-bit musical action-platform adventure. Play as the hooded bassist whose instrument reshapes the universe: bass waves awaken resonance nodes, note sequences tune ancient seals, harmony bursts strike guardians, and a resonant dash breaks through their defenses.

## Play
- Live game: https://resonance-arcade-rpg.onrender.com
- Install on mobile: open the live site in your browser and use the browser's install/add-to-home-screen option.
- Landscape layout is recommended; touch controls are supported.
- Keyboard: A/D or arrow keys move, Space/W/Up jumps, J sends a bass wave, K releases a harmony chord, Shift dashes.
- At a seal, enter the four-note solfege sequence with keys 1–4 or the on-screen DO/RE/MI/SOL pads.
- Collect all three resonance nodes and harmonize all three seals in each act. Exit through the opened gate.
- Each world has three acts; its guardian appears in the final act.
- Guardian weaknesses: Hollow King—chord; Root Mother—wave; Noise Engine—wave; Eclipse—dash; Discordant One—chord. The final guardian has a third phase.
- Defeating each guardian grants a choice of permanent upgrade. Progress is saved locally in the browser.

## Five soundscapes
1. The Hollow — The Hollow King
2. Forgotten Forest — The Root Mother
3. City of Discord — The Noise Engine
4. Realm of Shadows — The Eclipse
5. Celestial Kingdom — The Discordant One

## Campaign structure
- 5 worlds × 3 acts = 15 platforming acts.
- Each act has three resonance nodes, three distinct four-note seal sequences, traversal platforms, and a gate.
- One unique guardian battle concludes each world.
- The fifth guardian's final phase is the climax; victory restores harmony across all five soundscapes.

## Project structure
- `index.html`: responsive game shell, HUD, overlays and touchscreen controls
- `game.js`: platforming, puzzles, combat, boss phases, upgrades, save system and procedural world-scale soundtrack
- `assets/guardian_atlas.png`: 5 guardian rows × 4 animation poses (idle, attack, damage, defeat)
- `assets/guardian_manifest.json`: guardian names, weaknesses and atlas layout
- `manifest.webmanifest` and `sw.js`: installable PWA metadata and offline cache

## Deployment
Render Static Site, served from the `main` branch. No backend secrets or database are required.


## Visual polish and QA pass
- Hooded hero now has animated idle breathing, running leg/cloth motion, airborne posture, landing dust, strum pose, mirrored facing, dash afterimages, and hit flicker.
- Roaming demons have animated bobbing, limb motion, horn/eye detail, damage flash and readable health bars.
- Guardian presentation has a pulsing world-colored aura and warning ring layered over the four-pose guardian atlas.
- Bass waves and harmony bursts use animated multi-ring waveforms; chord attacks add radial spark bursts.
- Guardian projectiles have directional trails and pulsing impact rings; dash and damage create short-lived pixel particles.
- Automated smoke test: game starts, canvas render loop runs, movement/attack/dash frames render, demon and final guardian poses render, and touchscreen pointer controls bind in a simulated DOM.
- Gameplay simulation: note puzzle sequences, stage transitions, guardian spawn, demon defeat, and final boss phase transitions have been checked in the engine.
- Not yet verified: physical Android/iOS devices, real touch latency, device-specific FPS/thermals, browser audio policies, and install/offline behavior on actual handsets. Those require device/browser sessions.
