import unreal

asset_tools = unreal.AssetToolsHelpers.get_asset_tools()

wav_files = [
    '/Volumes/T7B/SHAHZAD/VoiceLine1.wav',
    '/Volumes/T7B/SHAHZAD/VoiceLine2.wav',
    '/Volumes/T7B/SHAHZAD/VoiceLine3.wav',
]

tasks = []
for wav in wav_files:
    name = wav.split('/')[-1].replace('.wav', '')
    task = unreal.AssetImportTask()
    task.filename = wav
    task.destination_path = '/Game/Audio'
    task.destination_name = name
    task.replace_existing = True
    task.automated = True
    task.save = True
    tasks.append(task)

asset_tools.import_asset_tasks(tasks)
print("=== WAV IMPORT RESULT ===")
for task in tasks:
    print(f"  {task.destination_name}: {task.imported_object_paths}")
print("DONE")
