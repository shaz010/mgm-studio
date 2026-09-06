import unreal
# Spawn AmbientSound actors in current level (LvL_Persia)
voice_lines = ['VoiceLine1', 'VoiceLine2', 'VoiceLine3']
ambient_class = unreal.AmbientSound.static_class()
for i, name in enumerate(voice_lines):
    sound = unreal.load_asset(f'/Game/Audio/{name}')
    if not sound:
        print(f"  NOT FOUND: {name}")
        continue
    loc = unreal.Vector(500, i * 300, 100)
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        ambient_class, loc, unreal.Rotator(0, 0, 0)
    )
    if actor:
        comp = actor.get_component_by_class(unreal.AudioComponent)
        if comp:
            comp.set_sound(sound)
            comp.set_editor_property('auto_activate', True)
        actor.set_actor_label(f'Audio_{name}')
        print(f"  Spawned: Audio_{name}")
    else:
        print(f"  FAILED: {name}")
unreal.EditorLevelLibrary.save_current_level()
print("=== DONE ===")
