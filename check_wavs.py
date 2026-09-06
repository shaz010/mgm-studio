import unreal

names = ['VoiceLine1', 'VoiceLine2', 'VoiceLine3']
for name in names:
    asset = unreal.load_asset(f'/Game/Audio/{name}')
    if asset:
        print(f"  {name}: FOUND — {type(asset).__name__}")
    else:
        print(f"  {name}: NOT FOUND")
print("DONE")
