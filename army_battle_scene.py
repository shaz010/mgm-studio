import unreal, time

ELL = unreal.EditorLevelLibrary
actors = ELL.get_all_level_actors()
by_label = {a.get_actor_label(): a for a in actors}

def get(label):
    a = by_label.get(label)
    if not a:
        print(f"WARNING: {label} not found")
    return a

def hide(label):
    a = get(label)
    if a: a.set_actor_hidden_in_game(True)

def show(label):
    a = get(label)
    if a: a.set_actor_hidden_in_game(False)

def set_light(label, intensity, color=None):
    a = get(label)
    if not a: return
    lc = a.get_component_by_class(unreal.LightComponent)
    if not lc: return
    lc.set_editor_property('intensity', float(intensity))
    if color:
        lc.set_editor_property('light_color', unreal.Color(int(color[0]), int(color[1]), int(color[2]), 255))

def pulse_light(label, hi, lo, count, interval):
    for _ in range(count):
        set_light(label, hi)
        time.sleep(interval)
        set_light(label, lo)
        time.sleep(interval)

def flash(label, count, interval):
    for _ in range(count):
        show(label)
        time.sleep(interval)
        hide(label)
        time.sleep(interval)
    show(label)

print("=== ARMY BATTLE SCENE START ===")

# Phase 0: Reset — hide BattleBillboard, dim tablets
hide('Persia_BattleBillboard')
for i in range(1, 5):
    set_light(f'Persia_TabletGlow_{i}', 100)
    set_light(f'Persia_TabletGlow_{i}', 100, color=(255, 200, 50))
print("Phase 0: reset done")
time.sleep(1.0)

# Phase 1: Tablet glows surge — army approaches
print("Phase 1: tablet surge")
for i in range(1, 5):
    set_light(f'Persia_TabletGlow_{i}', 800, color=(255, 140, 20))
    time.sleep(0.15)
time.sleep(0.8)

# Phase 2: BattleBillboard flashes in — dramatic army reveal
print("Phase 2: army billboard flash reveal")
flash('Persia_BattleBillboard', count=4, interval=0.18)
time.sleep(0.3)

# Phase 3: Torch flicker — army marching tension
print("Phase 3: torch flicker")
torch_actors = [f'Persia_Torch_{i}' for i in range(1, 9)]
for _ in range(3):
    # Flicker in pairs
    for label in torch_actors[::2]:  # odd torches
        hide(label)
    time.sleep(0.1)
    for label in torch_actors[::2]:
        show(label)
    for label in torch_actors[1::2]:  # even torches
        hide(label)
    time.sleep(0.1)
    for label in torch_actors[1::2]:
        show(label)
time.sleep(0.5)

# Phase 4: Tablet pulse — battle cry
print("Phase 4: tablet battle pulse")
for _ in range(3):
    for i in range(1, 5):
        set_light(f'Persia_TabletGlow_{i}', 2000, color=(255, 80, 0))
    time.sleep(0.25)
    for i in range(1, 5):
        set_light(f'Persia_TabletGlow_{i}', 400, color=(255, 200, 50))
    time.sleep(0.25)

# Phase 5: ArrivalBurst flare — battle begins
print("Phase 5: arrival burst")
set_light('Persia_ArrivalBurst', 5000, color=(255, 200, 50))
time.sleep(0.5)
set_light('Persia_ArrivalBurst', 1500, color=(255, 160, 30))
time.sleep(0.5)
set_light('Persia_ArrivalBurst', 0)

# Phase 6: Billboard sustained + tablets settle
print("Phase 6: settle")
show('Persia_BattleBillboard')
for i in range(1, 5):
    set_light(f'Persia_TabletGlow_{i}', 600, color=(255, 180, 40))

print("=== ARMY BATTLE SCENE COMPLETE ===")
