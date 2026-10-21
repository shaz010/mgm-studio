import unreal

ELL = unreal.EditorLevelLibrary
actors = ELL.get_all_level_actors()
by_label = {a.get_actor_label(): a for a in actors}

def hide_light(label):
    a = by_label.get(label)
    if not a:
        print(f"MISSING: {label}")
        return
    a.set_actor_hidden_in_game(True)
    lc = a.get_component_by_class(unreal.PointLightComponent)
    if lc:
        lc.set_editor_property('intensity', 0.0)
    print(f"Hidden: {label}")

# Portal mesh hidden at start
p = by_label.get('Portal_Persia')
if p:
    p.set_actor_hidden_in_game(True)
    print("Hidden: Portal_Persia")

# All portal lights hidden/off
for label in ['Portal_GoldLight', 'Portal_VioletRim',
              'London_GoldSurge', 'London_DangerStrobe']:
    hide_light(label)

for i in range(1, 7):
    hide_light(f'CuneiformLight_Portal_{i}')

# Save
ELL.save_current_level()
print("=== DEFAULT STATE SAVED ===")
