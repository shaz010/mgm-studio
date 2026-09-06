# SHAHZAD GAME — HANDOFF
Last updated: 2026-09-06 (session 5)

---

## IMMUTABLE SECURITY RULES
- ❌ NEVER Arabic script on any weapon, armour, or surface
- ❌ NEVER Islamic calligraphy — this is pre-Islamic Persia
- ✅ Script on surfaces = Ancient Old Persian cuneiform (خط میخی) OR Avestan Zoroastrian script ONLY

## IMMUTABLE CLAUDE BEHAVIOUR RULES
- Every 10 min: deliver updated handoff MD automatically
- All commands: always in a copyable code block — never inline text
- Terminal commands go in Terminal. UE5 commands go in UE5 Output Log Cmd. Never mix.
- Never ask Shaz to repeat context — read the handoff first every session
- After compaction: fetch this handoff from GitHub BEFORE doing any work
- Files to T7B: device_bash writes via $HOME/mnt/T7B/
- Handoff updates: ALWAYS write to ALL 3 — T7B/SHAHZAD/, T7B/Claude outputs/, AND give git Terminal commands
- GitHub: give Terminal commands only — Shaz runs them, Claude never pushes
- Short replies — eye strain. One action at a time.
- Blueprint instructions: ALWAYS give the FULL step in every message — never assume Shaz remembers a previous step. If he asks a question mid-step, restate the complete instruction with the question answered. Never make him scroll up. Every step names: which node, which side (left/right), which pin label.
- **UE5 MINIMIZE RULE (ALWAYS):** Open UE5 → run command → minimize immediately when done → open again for next command → minimize when done. NEVER leave UE5 open/unminimized between commands. Prevents Mac overheating.
- UE5 crash risk: NEVER call open_editor_for_assets or AssetEditorSubsystem
- device_bash runs in Linux VM — cannot run macOS commands like osascript
- widget_tree attribute does NOT exist in UE5.8 Python

---

## COMPLETED THIS SESSION

### Battle Scene Animation ✅ COMPLETE (2026-09-04)
- Script: /Volumes/T7B/battle_scene.py
- Run: py /Volumes/T7B/battle_scene.py
- 8-phase sequence (~12s total):
  - Phase 0: Hide all, Shahzad revealed on hero side (Y=-800)
  - Phase 1 (2s): Ahriman emerges (Y=1200)
  - Phase 2 (1.5s): AhrimanLight ignites
  - Phase 3 (2s): ShahzadWeapon billboards appear
  - Phase 4 (1.5s): Shahzad charges (Y=-200)
  - Phase 5 (1s): CLASH — AhrimanAttack flare, Ahriman moves to Y=800
  - Phase 6 (1.5s): AhrimanAttack hidden, Ahriman recoils to Y=1600
  - Phase 7 (1s): Victory — weapons fan out, AhrimanLight off
- All 8 phases confirmed COMPLETE in Output Log ✅

### Actor Tags Applied ✅ COMPLETE (2026-09-04)
- Script: /Volumes/T7B/tag_battle_actors.py
- Tagged: Persia_Shahzad_Hero → Shahzad
- Tagged: Persia_Shahzad_v1 → Shahzad
- Tagged: Persia_Ahriman_Full → Ahriman
- Tagged: Persia_AhrimanLight (untagged duplicate) → AhrimanLight
- Tagged: Enemy_1/2/3 → Enemy
- Level saved to LvL_Persia ✅

### Language Toggle Widget ✅ COMPLETE (2026-09-04)
- Asset: /Game/UI/WBP_LanguageToggle
- Gold button (amber R=1.0 G=0.72 B=0.0) with text "EN | فا"
- Compiled and saved

### Farsi Font Applied ✅ COMPLETE (2026-09-06)
- Font: /Game/UI/Fonts/F_Vazirmatn applied to TextBlock_0
- typeface_font_name set to 'Regular' (fix_font_typeface.py)
- Script: /Volumes/T7B/apply_font.py + fix_font_typeface.py
- Farsi glyphs now render properly with Vazirmatn font

### Language Toggle Logic ✅ COMPLETE (2026-09-06)
- FlipFlop wiring done via Python REPL (probe28.py)
- A branch → SetText25 → "EN | فا"
- B branch → SetText26 → "فا | EN"
- TextBlock_0 wired to both, orphan nodes removed, compiled and saved

### Portal Opening Sequence ✅ COMPLETE (2026-09-06)
- Script: /Volumes/T7B/portal_sequence.py
- Run: py /Volumes/T7B/portal_sequence.py (in LvL_London)
- 5-phase sequence: cuneiform lights → portal mesh → gold/violet → danger strobe → gold surge
- Confirmed WORKING (viewport went golden) ✅
- Reset script: /Volumes/T7B/portal_default_state.py

### Portal Faravahar Material ✅ COMPLETE (2026-09-06)
- M_Portal_Faravahar applied to Portal_Persia in LvL_London
- Script: /Volumes/T7B/apply_portal_faravahar.py
- Confirmed via probe: mat=M_Portal_Faravahar ✅

### Army Battle Scene ✅ COMPLETE (2026-09-06)
- Script: /Volumes/T7B/army_battle_scene.py
- Run: py /Volumes/T7B/army_battle_scene.py (in LvL_Persia)
- 6-phase sequence:
  - Phase 0: Reset — BattleBillboard hidden, tablets dim
  - Phase 1: Tablet glows surge amber (army approaches)
  - Phase 2: BattleBillboard flash reveal (4 flashes)
  - Phase 3: Torch flicker (alternating pairs, 3 cycles)
  - Phase 4: Tablet battle pulse (3x red/amber burst)
  - Phase 5: ArrivalBurst flare (5000 → 1500 → off)
  - Phase 6: BattleBillboard sustained + tablets settle
- All 6 phases confirmed COMPLETE ✅

### Ahriman Attack Sequence ✅ COMPLETE (2026-09-04)
- Script: /Volumes/T7B/ahriman_attack_sequence.py

### Shahzad Weapon Billboards ✅ COMPLETE (2026-09-04)
- Shahzad_Weapon_Pistol: (200, -600, 250) tag=ShahzadWeapon
- Shahzad_Weapon_Swords: (200, 600, 250) tag=ShahzadWeapon
- Shahzad_Weapon_SwordsCrossed: (300, 0, 500) tag=ShahzadWeapon

### LvL_Persia — Ahriman Confrontation ✅ COMPLETE (2026-09-04)
### LvL_London — Feature A: Portal Shockwave ✅ COMPLETE
### LvL_London — Feature C: Fright/Fascination/Exhilaration ✅ COMPLETE
### Git LFS ✅ COMPLETE

---

## PENDING — RESUME HERE NEXT SESSION

### Portal_Persia Faravahar Texture — BLOCKED
- Need Faravahar image from Shaz
- fal.ai available if needed for image gen

### WAV Import ✅ COMPLETE (2026-09-06)
- VoiceLine1.wav, VoiceLine2.wav, VoiceLine3.wav imported as SoundWave assets
- Location: /Game/Audio/VoiceLine1, VoiceLine2, VoiceLine3
- Script: /Volumes/T7B/import_wavs.py

### VoiceLine Wiring ✅ COMPLETE (2026-09-06)
- Audio_VoiceLine1/2/3 spawned as AmbientSound actors in LvL_Persia
- auto_activate=True — plays on level load
- Actor count: 70 → 73
- Script: /Volumes/T7B/spawn_audio_persia.py

### Faravahar Texture ✅ COMPLETE (2026-09-06)
- T_Faravahar_Portal.jpg generated via fal.ai FLUX dev
- Achaemenid Zoroastrian bas-relief style, amber/gold tones
- Imported as texture to /Game/LvL_Persia/T_Faravahar_Portal
- Source: /Volumes/T7B/SHAHZAD/T_Faravahar_Portal.jpg
- Script: /Volumes/T7B/import_faravahar.py
- M_Faravahar_Portal created at /Game/LvL_Persia/ — T_Faravahar_Portal wired to Base Color ✅
- Script: /Volumes/T7B/create_faravahar_mat.py
- Note: No portal actors in LvL_Persia — apply M_Faravahar_Portal to any future portal mesh

---

## ALL ACTOR TAGS IN LvL_Persia (confirmed 2026-09-04)
| Tag | Actors |
|-----|--------|
| Shahzad | Persia_Shahzad_Hero, Persia_Shahzad_v1 |
| Ahriman | Persia_Ahriman, Persia_Ahriman_Full |
| AhrimanLight | Persia_AhrimanLight (×2) |
| AhrimanAttack | Persia_AhrimanAttackFlare |
| ShahzadWeapon | Shahzad_Weapon_Pistol, Shahzad_Weapon_Swords, Shahzad_Weapon_SwordsCrossed |
| Enemy | Enemy_1, Enemy_2, Enemy_3 |
| PersiaColumn | Persia_Column_1–4 |
| PersiaTablet | Persia_CuneiformTablet_1–4, Persia_TabletGlow_1–4 |
| PersiaArrival | Persia_ArrivalTrigger, Persia_ArrivalBurst |

---

## ALL ACTORS IN LvL_PERSIA (confirmed 2026-09-06, 70 total)
Enemy_1/2/3 (Character), HeightFog, London_Hideout, London_Scene_v1/v2, London_Shahzad, London_ShahzadVillain, NavMeshBounds×2, Persia_Ahriman, Persia_AhrimanAttackFlare, Persia_AhrimanLight×2, Persia_Ahriman_Full, Persia_ArrivalBurst, Persia_ArrivalTrigger, Persia_BattleBillboard ← army backdrop, Persia_Column_1–4, Persia_CuneiformTablet_1–4, Persia_DustLayer, Persia_Faravahar_Power, Persia_Floor, Persia_Fog, Persia_Persepolis_Apocalypse, Persia_Pistol, Persia_Rostam_v1/v2, Persia_Roxana_Vault, Persia_ShahzadArrives, Persia_Shahzad_Hero, Persia_Shahzad_v1, Persia_Simorgh, Persia_Simorgh_Apadana, Persia_Simorgh_Glory, Persia_SkyLight, Persia_Sun, Persia_Swords, Persia_SwordsCrossed, Persia_TabletGlow_1–4, Persia_Torch_1–8, Persia_Wall_Back/Front/Left/Right, PlayerStart, RecastNavMesh-Default, Shahzad_Weapon_Pistol/Swords/SwordsCrossed, SkyAtmosphere, SkyLight, Sun

---

## GAME TIMELINE — LvL_Persia
- 0s: BeginPlay → golden scene, torches, columns
- 0.5s: PersiaArrival actors visible
- 5s after arrival: Ahriman billboard + red AhrimanLight + camera shake
- Manual: py /Volumes/T7B/army_battle_scene.py → army billboard sequence
- Manual: py /Volumes/T7B/battle_scene.py → full 8-phase Shahzad vs Ahriman battle

## GAME TIMELINE — LvL_London
- 2s: Ahura Mazda voice — VoiceLine1/2/3 imported (/Game/Audio/), assign in Level Blueprint
- 6s: Cuneiform lights glow
- 10s: Villain_Ghost + DangerStrobe
- 18s: Portal + Camera Shake + Slow Motion → GoldSurge
- Manual: py /Volumes/T7B/portal_sequence.py → portal opening animation

---

## FILE LOCATIONS
| File | Path |
|------|------|
| Game Repo | https://github.com/shaz010/mgm-studio |
| Handoff | T7B/SHAHZAD/SHAHZAD_GAME_HANDOFF.md |
| Battle script | /Volumes/T7B/battle_scene.py |
| Army battle | /Volumes/T7B/army_battle_scene.py |
| Portal sequence | /Volumes/T7B/portal_sequence.py |
| Portal reset | /Volumes/T7B/portal_default_state.py |
| Tag script | /Volumes/T7B/tag_battle_actors.py |
| Ahriman script | /Volumes/T7B/ahriman_attack_sequence.py |
| Weapons script | /Volumes/T7B/place_weapons.py |

## KEY FACTS
- GitHub: github.com/shaz010 (repo: mgm-studio)
- T7B mount in device_bash: $HOME/mnt/T7B/
- UE5 Python: run via Output Log Cmd as py /Volumes/T7B/scriptname.py
- Farsi address: شما (NEVER تو)
- UE5 crash risk: NEVER call open_editor_for_assets or AssetEditorSubsystem
