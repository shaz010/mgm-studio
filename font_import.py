"""
Import Vazirmatn-Regular.ttf into UE5 and apply to WBP_LanguageToggle TextBlock_0
Run: py /Volumes/T7B/font_import.py
"""
import unreal

print("[FONT] Starting Vazirmatn import...")

# Import the TTF
task = unreal.AssetImportTask()
task.set_editor_property('filename', '/Volumes/T7B/Vazirmatn-Regular.ttf')
task.set_editor_property('destination_path', '/Game/Fonts')
task.set_editor_property('destination_name', 'Vazirmatn')
task.set_editor_property('replace_existing', True)
task.set_editor_property('automated', True)
task.set_editor_property('save', True)

unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
print(f"[FONT] Imported: {task.imported_object_paths}")

# Verify font exists
font_asset = unreal.load_asset('/Game/Fonts/Vazirmatn')
if font_asset:
    print(f"[FONT] Font asset loaded: {font_asset.get_class().get_name()}")
else:
    print("[FONT] ERROR: Font asset not found after import")

print("[FONT] DONE")
