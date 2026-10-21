import unreal

ELL = unreal.EditorLevelLibrary
actors = ELL.get_all_level_actors()
by_label = {a.get_actor_label(): a for a in actors}

portal = by_label.get('Portal_Persia')
if not portal:
    print("ERROR: Portal_Persia not found")
else:
    print(f"Portal_Persia: {portal}")
    # Load the Faravahar material
    mat = unreal.load_object(None, '/Game/LvL_London/Materials/M_Portal_Faravahar.M_Portal_Faravahar')
    if not mat:
        # Try alternate path
        mat = unreal.load_object(None, '/Game/LvL_Persia/M_Shahzad_Faravahar.M_Shahzad_Faravahar')
    print(f"Material: {mat}")
    
    if mat:
        smc = portal.get_component_by_class(unreal.StaticMeshComponent)
        if smc:
            smc.set_material(0, mat)
            print("Material applied to element 0")
        else:
            print("No StaticMeshComponent found")
        
        # Save level
        ELL.save_current_level()
        print("=== SAVED ===")
    else:
        print("Material not found — checking paths:")
        for path in ['/Game/LvL_London/Materials', '/Game/LvL_Persia']:
            assets = unreal.EditorAssetLibrary.list_assets(path, recursive=False)
            for a in assets:
                print(f"  {a}")
