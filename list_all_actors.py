import unreal

ELL = unreal.EditorLevelLibrary
actors = ELL.get_all_level_actors()
lines = [f"Total actors: {len(actors)}"]
for a in sorted(actors, key=lambda x: x.get_actor_label()):
    lines.append(f"  {a.get_actor_label()} | {type(a).__name__}")
lines.append("DONE")
out = "\n".join(lines)
print(out)
with open('/Volumes/T7B/all_actors_result.txt', 'w') as f:
    f.write(out)
