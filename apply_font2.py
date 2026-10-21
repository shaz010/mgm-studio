import unreal

print("[LDN] apply_font2.py starting...")

font_asset = unreal.load_asset('/Game/Fonts/Vazirmatn')
if not font_asset:
    print("[LDN] ERROR: Font not found")
else:
    print(f"[LDN] Font class: {font_asset.get_class().get_name()}")

# List all assets in /Game/Fonts to find the right one
ar = unreal.AssetRegistryHelpers.get_asset_registry()
fonts = ar.get_assets_by_path('/Game/Fonts', recursive=True)
for f in fonts:
    print(f"[LDN] Asset in /Game/Fonts: {f.asset_name} ({f.asset_class_path.asset_name})")

# Find TextBlock objects in the WBP_LanguageToggle package via ObjectIterator
found = []
for obj in unreal.ObjectIterator(unreal.TextBlock):
    outer = obj.get_outer()
    outer_name = outer.get_name() if outer else ''
    pkg = obj.get_package()
    pkg_name = pkg.get_name() if pkg else ''
    if 'LanguageToggle' in pkg_name or 'LanguageToggle' in outer_name:
        print(f"[LDN] Found TextBlock: {obj.get_name()} in {pkg_name}")
        found.append(obj)

if not found:
    print("[LDN] No TextBlock found via ObjectIterator. Trying load_object...")
    # Try direct object paths
    paths = [
        '/Game/UI/WBP_LanguageToggle.WBP_LanguageToggle:WidgetTree.TextBlock_0',
        '/Game/UI/WBP_LanguageToggle.WBP_LanguageToggle_C:WidgetTree.TextBlock_0',
    ]
    for p in paths:
        obj = unreal.find_object(None, p)
        if obj:
            print(f"[LDN] Found via path: {p}")
            found.append(obj)
            break

for tb in found:
    try:
        fi = tb.get_editor_property('font')
        fi.set_editor_property('font_object', font_asset)
        tb.set_editor_property('font', fi)
        print(f"[LDN] Font applied to {tb.get_name()} ✓")
    except Exception as e:
        print(f"[LDN] Error applying font: {e}")

# Mark blueprint dirty and save
try:
    unreal.EditorAssetLibrary.save_asset('/Game/UI/WBP_LanguageToggle', False)
    print("[LDN] Saved ✓")
except Exception as e:
    print(f"[LDN] Save error: {e}")

print("[LDN] apply_font2 DONE")
