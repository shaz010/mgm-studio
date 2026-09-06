import unreal, time

ELL = unreal.EditorLevelLibrary
actors = ELL.get_all_level_actors()

# Index actors by label
by_label = {a.get_actor_label(): a for a in actors}

def get(label):
    a = by_label.get(label)
    if not a:
        print(f"MISSING: {label}")
    return a

def set_light(label, intensity, visible=True, color=None):
    a = get(label)
    if not a: return
    a.set_actor_hidden_in_game(not visible)
    lc = a.get_component_by_class(unreal.PointLightComponent)
    if lc:
        lc.set_editor_property('intensity', float(intensity))
        if color:
            lc.set_editor_property('light_color', unreal.Color(r=color[0], g=color[1], b=color[2], a=255))

print("=== PORTAL OPENING SEQUENCE ===")

# --- PHASE 0: Reset — all portal lights hidden/dim ---
print("Phase 0: Reset")
portal_mesh = get('Portal_Persia')
if portal_mesh:
    portal_mesh.set_actor_hidden_in_game(True)

set_light('Portal_GoldLight', 0, visible=False)
set_light('Portal_VioletRim', 0, visible=False)
set_light('London_GoldSurge', 0, visible=False)
set_light('London_DangerStrobe', 0, visible=False)

for i in range(1, 7):
    set_light(f'CuneiformLight_Portal_{i}', 0, visible=False)

time.sleep(0.5)

# --- PHASE 1: Cuneiform lights flicker on (1.5s) ---
print("Phase 1: Cuneiform lights ignite")
for i in range(1, 7):
    set_light(f'CuneiformLight_Portal_{i}', 800, visible=True,
              color=(255, 200, 80))  # amber gold
    time.sleep(0.25)

time.sleep(0.5)

# --- PHASE 2: Portal mesh appears + gold light ignites (1s) ---
print("Phase 2: Portal mesh + gold light")
if portal_mesh:
    portal_mesh.set_actor_hidden_in_game(False)
set_light('Portal_GoldLight', 3000, visible=True, color=(255, 215, 0))
time.sleep(0.5)
set_light('Portal_VioletRim', 1500, visible=True, color=(180, 80, 255))

time.sleep(1.0)

# --- PHASE 3: DangerStrobe pulses (simulate 3 flashes) ---
print("Phase 3: Danger strobe")
for _ in range(3):
    set_light('London_DangerStrobe', 5000, visible=True, color=(255, 60, 0))
    time.sleep(0.15)
    set_light('London_DangerStrobe', 0, visible=False)
    time.sleep(0.15)

time.sleep(0.3)

# --- PHASE 4: GoldSurge erupts ---
print("Phase 4: Gold surge")
set_light('London_GoldSurge', 8000, visible=True, color=(255, 230, 50))
time.sleep(0.5)
# Ramp down to steady glow
set_light('London_GoldSurge', 3000, visible=True, color=(255, 200, 30))

time.sleep(0.5)

# --- PHASE 5: Portal gold light pulses bright then settles ---
print("Phase 5: Portal settles")
set_light('Portal_GoldLight', 6000, visible=True, color=(255, 220, 0))
time.sleep(0.4)
set_light('Portal_GoldLight', 2500, visible=True, color=(255, 215, 0))

print("=== SEQUENCE COMPLETE ===")
