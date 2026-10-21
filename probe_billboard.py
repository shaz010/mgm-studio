import unreal, time

ELL = unreal.EditorLevelLibrary
actors = ELL.get_all_level_actors()

print("=== SEARCHING ALL ACTORS IN LvL_PERSIA ===")
for a in actors:
    label = a.get_actor_label()
    if 'battle' in label.lower() or 'billboard' in label.lower() or 'army' in label.lower():
        loc = a.get_actor_location()
        smc = a.get_component_by_class(unreal.StaticMeshComponent)
        mat = smc.get_material(0) if smc else None
        mesh = smc.get_editor_property('static_mesh') if smc else None
        print(f"FOUND: {label} | type={type(a).__name__} | loc={loc} | mat={mat} | mesh={mesh}")
        try:
            print(f"  bHiddenInGame: {smc.get_editor_property('bHiddenInGame')}")
        except Exception as e:
            print(f"  bHiddenInGame err: {e}")

print("=== PERSIA ACTORS ===")
for a in actors:
    if 'persia' in a.get_actor_label().lower():
        print(f"  {a.get_actor_label()} | {type(a).__name__}")
print("DONE")
