"""
LvL_London Setup Script
Run from UE5 Output Log Cmd: py /Volumes/T7B/london_setup.py
Confirmed working: Sep 6 2026
DO NOT call load_level() — run while LvL_London is already open.
"""
import unreal

print("[LvLLondon] Running in current level...")
actors = unreal.EditorLevelLibrary.get_all_level_actors()
print(f"[LvLLondon] Actors: {len(actors)}")

villain_exists = any(a.get_actor_label() == 'Villain_LondonShadow' for a in actors)
ghost_exists   = any(a.get_actor_label() == 'Villain_Ghost' for a in actors)

if villain_exists:
    print("[LvLLondon] Villain_LondonShadow already exists")
elif ghost_exists:
    for a in actors:
        if a.get_actor_label() == 'Villain_Ghost':
            a.set_actor_label('Villain_LondonShadow')
            print("[LvLLondon] Renamed Villain_Ghost -> Villain_LondonShadow")
else:
    bp_class = unreal.load_asset('/Game/LvL_London/Characters/BP_VillainGhost')
    if bp_class:
        v = unreal.EditorLevelLibrary.spawn_actor_from_object(
            bp_class, unreal.Vector(0, 0, 100), unreal.Rotator(0, 0, 0))
        v.set_actor_label('Villain_LondonShadow')
        print("[LvLLondon] Spawned Villain_LondonShadow")
    else:
        print("[LvLLondon] WARNING: BP_VillainGhost not found")

actors = unreal.EditorLevelLibrary.get_all_level_actors()
fog_actors = [a for a in actors if isinstance(a, unreal.ExponentialHeightFog)]
if fog_actors:
    comp = fog_actors[0].get_component_by_class(unreal.ExponentialHeightFogComponent)
    if comp:
        try:
            comp.set_editor_property('fog_density', 0.15)
            print("[LvLLondon] fog_density = 0.15")
        except Exception as e:
            print(f"[LvLLondon] fog_density error: {e}")
        try:
            color = unreal.LinearColor(0.05, 0.05, 0.08, 1.0)
            comp.set_editor_property('fog_inscattering_luminance', color)
            print("[LvLLondon] fog_inscattering_luminance (dark Victorian blue)")
        except Exception as e:
            print(f"[LvLLondon] fog color error: {e}")
else:
    print("[LvLLondon] No ExponentialHeightFog found")

unreal.EditorLevelLibrary.save_all_dirty_levels()
print("[LvLLondon] DONE saved")
