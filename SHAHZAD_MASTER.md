# SHAHZAD MASTER RULES — READ THIS FIRST, EVERY SESSION
## Last Updated: 2026-08-29

---

## PROJECT SCOPE — READ FIRST
- **This file is SHAHZAD GAME ONLY** — UE5 dual-world British-Persian action game
- **TAGJ** (The Autobiography of God-Jinn) is a **completely separate project** tracked in github.com/Shaz010/eee-journal ONLY
- Never mix TAGJ tasks, files, or context into this workspace

---

## WHO IS SHAZ

- On **Mac** — ALWAYS use Mac keys
- **Option** (⌥) = what other systems call Alt — NEVER say "Alt"
- **Command** (⌘) = what other systems call Ctrl — NEVER say "Ctrl"
- Shaz is not a Blueprint/UE5 expert — give directions like talking to a 10-year-old
- Shaz is NOT to be sent hunting for settings manually — EVER

---

## HOW TO DIRECT SHAZ — BLUEPRINT / UE5

- ALWAYS say: which **box** (its name), which **side** (LEFT / RIGHT / TOP / BOTTOM), what **colour** the wire or dot is
- NEVER use jargon: no "exec", "pin", "node", "execution flow" — say WHITE wire, LEFT side, dot, box
- NEVER lecture — directions only, clean and precise
- NEVER send Shaz to search for a setting in the Details panel — use Python
- ONE instruction at a time — wait for "D" before next step

---

## WORKFLOW RULES — NEVER BREAK

- ✅ ALWAYS Python scripts to set properties
- ✅ ALWAYS write scripts via Terminal: `cat > /Volumes/T7B/script.py << 'PYEOF'`
- ❌ NEVER TextEdit
- ❌ NEVER ask Shaz to scroll or search Details panel
- ✅ Stick to agreed game design and architecture — NO improvisation without Shaz's agreement
- ✅ Ask the RIGHT questions before starting — one wrong assumption = circles
- ❌ NEVER ask Shaz to choose priority order — determine logical sequence yourself and proceed
- ❌ NEVER guess UE5 UI locations — max 2 attempts, then send a research agent to find the correct answer before proceeding
- ✅ To run any script: paste in UE5 Output Log Cmd field: `py /Volumes/T7B/scriptname.py`

---

## UE5 MENU LOCATIONS

- **Level Blueprint**: Toolbar → **Blueprints button** (blueprint icon, near Play button) → "Open Level Blueprint" ✅ CONFIRMED UE5.8 Mac
- **Output Log / Cmd field**: Bottom panel → Output Log tab → Cmd field at bottom
- **Collision settings**: NEVER ask Shaz to find — use Python
- **Any property change**: ALWAYS Python first

---

## SECURITY RULES — NEVER BREAK

- ❌ NEVER Arabic script on any weapon, armour, or surface
- ❌ NEVER Islamic calligraphy — this is pre-Islamic Persia
- ✅ Script on weapons = **Ancient Old Persian cuneiform** OR **Avestan Zoroastrian script ONLY**

---

## GAME ARCHITECTURE — NEVER DEVIATE WITHOUT SHAZ'S AGREEMENT

- Game: SHAHZAD — dual-world British-Persian action game
- Engine: UE5 (5.8) on Mac
- Project path: `/Volumes/T7B/SHAHZAD/SHAHZAD.uproject`
- Launch command: `open /Volumes/T7B/UE_5.8/Engine/Binaries/Mac/UnrealEditor.app --args /Volumes/T7B/SHAHZAD/SHAHZAD.uproject`
- Game Mode: BP_ThirdPersonGameMode
- Active levels: LvL_Memory, LvL_Persia, LvL_London (created Aug 29)

---

## KEY LESSONS — NEVER REPEAT THESE MISTAKES

- Fresh start beats endless fixing
- Restart fixes corrupted clipboard
- UE5 Python .pyc caching — use new filenames when scripts don't update
- **Escape key can crash UE5** — use ■ Stop button
- Mac autocorrect mangles T7B → TB7 — always paste paths, never type
- BlockingVolume / wall mesh with BlockAll collision = reliable; spawned Cube mesh collision = unreliable
- Use `pbcopy <<< "command"` in Terminal to pre-load clipboard before switching to UE5
- `a.tags.append()` does NOT persist in UE5 Python — use `a.set_editor_property('tags', list)`
- **Level Blueprint**: Toolbar → Blueprints button (icon only, near Play) → hover for tooltip → "Open Level Blueprint"
- UE5 Python CANNOT wire Blueprint nodes — manual only
- Option+click white wire = break it (Mac)
- **PlaySound2D fires instantly** — does NOT wait for audio to finish. Use Delay nodes between each sound
- **fal-ai download links expire fast** — use `curl -L "url" -o ~/Downloads/filename.wav` in Terminal immediately
- **Create Widget** — if it shows "Construct NONE", a wrong node was created. Delete it, right-click → Create Widget, select the correct class (e.g. WBP_SimorghDialogue)
- **ElevenLabs API unreachable from cloud container** — run all ElevenLabs curl commands from Shaz's Mac Terminal directly
- **ElevenLabs standard voices** (Harry, Daniel, Brian, Liam) — all rejected by Shaz. Too common, heard everywhere. Plan: iPhone → Logic Pro

---

## PYTHON SCRIPTS ON T7B

- `fix_level.py` — fixes collision, PlayerStart
- `fix_float.py` — physics off on BP_MemoryFragment
- `fix_start.py` — moves PlayerStart
- `barrier_final.py` — spawns BP_LockedMemory wall barrier at Y=-1200
- `barrier_arrow.py` — spawns red light marker above barrier
- `tag_fix.py` — tags BP_LockedMemory + BARRIER_MARKER with "Barrier"
- `remove_marker.py` — removes red light after testing
- `clean_barriers.py` — removes duplicate BP_LockedMemory actors
- `diag2.py` — lists all actors with location
- `rebuild_enemy.py` — deletes old BP_Enemy, duplicates ThirdPerson template, places 3 enemies in LvL_Persia at Z=88
- `set_enemy_ai_controller.py` — sets AIController + AutoPossessAI on BP_Enemy
- `fix_mesh_z.py` — sets mesh Z=-88, Yaw=-90 on BP_Enemy
- `set_enemy_anim.py` — sets ABP_Unarmed animation blueprint on BP_Enemy

---

## HOW TO START EVERY SESSION

1. Say: **"Read /Volumes/T7B/SHAHZAD_MASTER.md"**
2. I read it before doing anything else
3. Then we work

---

## CURRENT STATE (2026-08-29)

### LvL_Memory — COMPLETE ✅
- Level Blueprint compiled clean — no errors ✅
- Voice lines wired: BeginPlay → Delay(5s) → VoiceLine3 → Delay(4s) → VoiceLine2 → Delay(4s) → VoiceLine1 → Delay(2s) → WBP_SimorghDialogue ✅
- WBP_SimorghDialogue appears 2 seconds after last voice line ✅
- PLAY TESTED: All 3 voice lines fire in sequence, collecting 5 thoughts triggers scene change ✅
- Audio files: VoiceLine1/2/3.wav in /Game/Audio/ — fal-ai placeholders ONLY
- **PENDING**: Replace placeholder audio with iPhone recording → Logic Pro (reverb, delay, pitch drop)

### LvL_Persia — Enemies WALKING ✅
- BP_Enemy: rebuilt, standing, AIController set ✅
- BP_Enemy: BeginPlay → Delay(10s) → AI MoveTo player ✅
- ALL 3 ENEMIES walk toward player 10 seconds after level start ✅
- BP_Enemy error nodes (StopJumping, IA_Look) deleted — compiled clean ✅

### LvL_London — CREATED ✅
- Empty level created at /Game/LvL_London.umap ✅
- Pushed to GitHub ✅
- PENDING: Build out London environment

### PENDING — NEXT SESSION
1. **Voice lines** — iPhone recording when quiet → AirDrop to Mac → Logic Pro (reverb, delay, pitch drop) → import as WAV → replace in /Game/Audio/ → reimport in UE5
2. **Climax sound** — same process: iPhone → Logic Pro → import WAV into UE5
3. **LvL_London** — build out the London environment
4. **GitHub push** after each meaningful fix

---

## 🏆 BREAKTHROUGHS LOG

### Session: Aug 28 2026

**✅ How to open Level Blueprint in UE5.8**
- Blueprints button is in main toolbar — icon only, no text label
- Hover icons near Play button until tooltip says: "List of world Blueprints available to the user for editing or creation."
- Click → "Open Level Blueprint"
- Content Browser, Find in Blueprints, and Python ObjectIterator all FAIL to find Level BPs
- THIS TOOLBAR BUTTON IS THE ONLY RELIABLE WAY

**✅ LvL_Memory Level Blueprint compiled clean — no errors**

**✅ BP_Enemy identified for AI fix**
- Path: /Game/BP_Enemy
- Missing: BeginPlay → Delay(10s) → AI MoveTo → Get Player Character

**✅ RULE: GitHub push after each meaningful fix — not batched at end of session**

### Session: Aug 29 2026

**✅ BP_Enemy error nodes deleted — compiled clean**
- Deleted: K2Node_CallFunction_23 (StopJumping) — leftover player input node
- Deleted: K2Node_EnhancedInputAction_4 (IA_Look) — leftover player input node
- Both were ErrorType=1 — not connected to anything, safe to delete
- Compiled BP_Enemy: CLEAN — no errors

**✅ AI MoveTo COMPLETE (carried over from Aug 28)**
- Connected: BeginPlay → Delay(10.0s) → AI MoveTo → Target Actor (Get Player Character Return Value)
- Connected: AI MoveTo Pawn pin → Self
- ALL 3 ENEMIES walk toward player 10 seconds after level start ✅

**✅ LvL_London created**
- Empty level: /Game/LvL_London.umap
- Pushed to GitHub ✅

**✅ Voice lines generated and wired in LvL_Memory Level Blueprint**
- VoiceLine3: "The past is not gone. It breathes beneath your feet."
- VoiceLine2: "Ahura Mazda watches. Every step is judgment."
- VoiceLine1: "You were here before. You will be here again."
- Chain: BeginPlay → Delay(5s) → VoiceLine3 → Delay(4s) → VoiceLine2 → Delay(4s) → VoiceLine1 → Delay(2s) → WBP_SimorghDialogue
- KEY LESSON: PlaySound2D fires instantly — Delay nodes needed between each sound

**✅ WBP_SimorghDialogue connected to LvL_Memory**
- Appears 2 seconds after VoiceLine1 finishes
- Create Widget (WBP_SimorghDialogue) → Add to Viewport

**✅ PLAY TEST SUCCESS**
- All 3 voice lines fired in correct sequence
- Collecting 5 thoughts triggered scene change
- Full flow working end-to-end

**⚠️ Voice quality — all standard options rejected**
- fal-ai voices: placeholder quality only
- ElevenLabs Harry, Daniel, Brian, Liam: all rejected ("heard all over YouTube")
- PLAN: iPhone recording → AirDrop → Logic Pro (reverb, delay, pitch drop) → unique cinematic Simorgh voice

---

## FILE BACKUP RULES — CONFIRMED WORKING METHOD

- ❌ device_bash CANNOT write to Mac Desktop (`~/Desktop`) — permission denied
- ✅ device_bash CAN write to `~/Downloads/eee-journal/` directly
- Backup command that works:
```
cp /sessions/rcw-01n1dnttazzwetxkdds6pbrn/mnt/T7B/SHAHZAD_MASTER.md /sessions/rcw-01n1dnttazzwetxkdds6pbrn/mnt/Downloads/eee-journal/
```
- Then Shaz runs in Terminal: `cd ~/Downloads/eee-journal && git add -A && git commit -m "message" && git push`

---

## CLIMAX LINE — LOCKED ✅

**Speaker:** The Simorgh  
**Moment:** Before final confrontation with the dark sorcerer  
**Line:** "Ahura Mazda did not choose you because you are ready. He chose you because it is time."

- iPhone → AirDrop → Logic Pro (reverb, delay, pitch drop) → WAV → import UE5

---

## NEXT FEATURES — BUILD ORDER (hardest → easiest)

| # | Feature | Complexity |
|---|---------|------------|
| 1 | Portal opening sequence — screen shake, audio swell, Simorgh cry, geometric gold tear | ████████░░ Hardest |
| 2 | Ahura Mazda's voice — one divine line, climax only | ███████░░░ |
| 3 | Villain appears in LvL_London — distant, watching, vanishes on look | ██████░░░░ |
| 4 | Spatial/quadraphonic audio — Simorgh circles you, villain heard before seen | █████░░░░░ |
| 5 | Heartbeat tabla pulse — speeds up near enemies | █████░░░░░ |
| 6 | Weather reacts to danger — rain/fog intensifies near enemies | ████░░░░░░ |
| 7 | Slow motion kill — last enemy dies, feather falls | ███░░░░░░░ |
| 8 | Cuneiform glows brighter as you approach | ██░░░░░░░░ Easiest |

Start at #1, work down in order. Never skip ahead.
