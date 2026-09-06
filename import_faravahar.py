import unreal
import urllib.request
import os

# Download the generated Faravahar image via Mac network
url = "https://v3b.fal.media/files/b/0aa95ca4/Bj0RYBSJA5wPre1kQqiRq.jpg"
local_path = "/Volumes/T7B/SHAHZAD/T_Faravahar_Portal.jpg"

print(f"Downloading from fal.ai...")
try:
    urllib.request.urlretrieve(url, local_path)
    size = os.path.getsize(local_path)
    print(f"Downloaded: {size} bytes → {local_path}")
except Exception as e:
    print(f"Download failed: {e}")
    exit()

# Import as UE5 texture
asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
task = unreal.AssetImportTask()
task.filename = local_path
task.destination_path = '/Game/LvL_Persia'
task.destination_name = 'T_Faravahar_Portal'
task.replace_existing = True
task.automated = True
task.save = True
asset_tools.import_asset_tasks([task])

print("=== IMPORT RESULT ===")
print(f"  Imported: {task.imported_object_paths}")
print("DONE")
