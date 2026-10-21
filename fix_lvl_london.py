import unreal

print("[LondonFix] Opening LvL_London via LevelEditorSubsystem...")

les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
result = les.load_level('/Game/LvL_London/LvL_London')
print(f"[LondonFix] load_level result: {result}")

actors = unreal.EditorLevelLibrary.get_all_level_actors()
print(f"[LondonFix] Actors in level: {len(actors)}")
for a in actors[:30]:
    print(f"  {a.get_actor_label()} ({type(a).__name__})")

villain_exists = any(a.get_actor_label() == 'Villain_LondonShadow' for a in actors)
if not villain_exists:
    bp_class = unreal.load_asset('/Game/LvL_London/Characters/BP_VillainGhost')
    if bp_class:
        villain = unreal.EditorLevelLibrary.spawn_actor_from_object(
            bp_class, unreal.Vector(0, 0, 100), unreal.Rotator(0, 0, 0))
        villain.set_actor_label('Villain_LondonShadow')
        print("[LondonFix] Spawned Villain_LondonShadow")
    else:
        print("[LondonFix] WARNING: BP_VillainGhost not found")
else:
    print("[LondonFix] Villain_LondonShadow already exists")

actors = unreal.EditorLevelLibrary.get_all_level_actors()
fog_set = False
for a in actors:
    label = a.get_actor_label().lower()
    if 'fog' in label or 'heightfog' in label:
        comps = a.get_components_by_class(unreal.ExponentialHeightFogComponent)
        for comp in comps:
            try:
                comp.set_editor_property('fog_density', 0.15)
                print(f"[LondonFix] Set fog_density on {a.get_actor_label()}")
            except Exception as e:
                print(f"[LondonFix] fog_density error: {e}")
            try:
                color = unreal.LinearColor(0.05, 0.05, 0.08, 1.0)
                comp.set_editor_property('fog_inscattering_color', color)
                print(f"[LondonFix] Set inscattering_color on {a.get_actor_label()}")
            except Exception as e:
                print(f"[LondonFix] inscattering error: {e}")
        fog_set = True

if not fog_set:
    print("[LondonFix] No fog actor found -- skipping fog")

unreal.EditorLevelLibrary.save_all_dirty_levels()
print("[LondonFix] DONE -- LvL_London setup complete")
