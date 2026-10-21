import unreal
print("[LDN] apply_font.py starting...")

font_asset = unreal.load_asset('/Game/Fonts/Vazirmatn')
if not font_asset:
    print("[LDN] ERROR: Vazirmatn font not found at /Game/Fonts/Vazirmatn")
else:
    print(f"[LDN] Font loaded: {font_asset.get_class().get_name()}")

bp = unreal.load_asset('/Game/UI/WBP_LanguageToggle')
if not bp:
    print("[LDN] ERROR: WBP_LanguageToggle not found")
else:
    print(f"[LDN] Blueprint loaded: {bp.get_class().get_name()}")

try:
    tree = bp.widget_tree
    widgets = tree.get_all_widgets()
    print(f"[LDN] Widgets in tree: {len(widgets)}")
    for w in widgets:
        name = w.get_name()
        cls = w.get_class().get_name()
        print(f"[LDN]   {name} ({cls})")
        if 'TextBlock' in cls or 'TextBlock' in name:
            try:
                fi = w.get_editor_property('font')
                fi.set_editor_property('font_object', font_asset)
                w.set_editor_property('font', fi)
                print(f"[LDN] Font applied to {name} ✓")
            except Exception as e:
                print(f"[LDN] Font set error on {name}: {e}")
except Exception as e:
    print(f"[LDN] Widget tree error: {e}")

try:
    unreal.EditorAssetLibrary.save_asset('/Game/UI/WBP_LanguageToggle', False)
    print("[LDN] WBP_LanguageToggle saved ✓")
except Exception as e:
    print(f"[LDN] Save error: {e}")

print("[LDN] apply_font DONE")
