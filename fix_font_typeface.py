import unreal

# Load the widget blueprint and TextBlock
tb = unreal.load_object(None, '/Game/UI/WBP_LanguageToggle.WBP_LanguageToggle:WidgetTree.TextBlock_0')
if not tb:
    print("ERROR: TextBlock_0 not found")
else:
    font_info = tb.get_editor_property('font')
    print(f"Current typeface_font_name: '{font_info.typeface_font_name}'")
    print(f"Current font_object: {font_info.font_object}")
    
    # Set typeface to 'Regular'
    font_info.set_editor_property('typeface_font_name', 'Regular')
    tb.set_editor_property('font', font_info)
    
    # Verify
    verify = tb.get_editor_property('font')
    print(f"NEW typeface_font_name: '{verify.typeface_font_name}'")
    
    # Compile and save
    bp = unreal.load_object(None, '/Game/UI/WBP_LanguageToggle.WBP_LanguageToggle')
    unreal.BlueprintEditorLibrary.compile_blueprint(bp)
    print("Compiled OK")
    unreal.EditorAssetLibrary.save_asset('/Game/UI/WBP_LanguageToggle', True)
    print("Saved OK")
