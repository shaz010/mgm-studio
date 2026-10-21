import unreal, time

# ─── BATTLE SCENE ANIMATION ───────────────────────────────────────────────────
# Shahzad vs Ahriman — LvL_Persia
# Phase timeline:
#   0  – Setup: hide all, reveal Shahzad (hero side)
#   1  – 2s delay → Ahriman emerges from darkness
#   2  – 1.5s → AhrimanLight ignites (atmosphere)
#   3  – 2s  → Weapons materialize around Shahzad
#   4  – 1.5s → Shahzad charges (move to Y=600)
#   5  – 1s  → Clash! AhrimanAttack flare fires
#   6  – 1.5s → Ahriman recoils (move to Y=1400)
#   7  – 1s  → Weapons spread (victory formation)
#   8  – Done, unregister

_state = {"phase": -1, "t": 0.0, "handle": None}

def _world():
    return unreal.EditorLevelLibrary.get_editor_world()

def _tag(tag):
    return list(unreal.GameplayStatics.get_all_actors_with_tag(_world(), tag))

def _show(tag):
    for a in _tag(tag):
        a.set_actor_hidden_in_game(False)

def _hide(tag):
    for a in _tag(tag):
        a.set_actor_hidden_in_game(True)

def _move_y(tag, y_val):
    for a in _tag(tag):
        loc = a.get_actor_location()
        a.set_actor_location(unreal.Vector(loc.x, y_val, loc.z), False, False)

def _tick(dt):
    s = _state
    now = time.time()

    if s["phase"] == -1:
        # Phase -1: Ahura Mazda speaks before battle
        actors = unreal.EditorLevelLibrary.get_all_level_actors()
        for a in actors:
            if a.get_actor_label() == 'Audio_AhuraMazda':
                comp = a.get_component_by_class(unreal.AudioComponent)
                if comp:
                    comp.play(0.0)
                    print("[Battle] Phase -1 – Ahura Mazda speaks.")
        s["t"] = now; s["phase"] = 0

    elif s["phase"] == 0 and now - s["t"] >= 7.0:
        for tag in ["Ahriman", "AhrimanLight", "AhrimanAttack", "ShahzadWeapon"]:
            _hide(tag)
        _show("Shahzad")
        _move_y("Shahzad", -800.0)
        _move_y("Ahriman", 1800.0)
        print("[Battle] Phase 0 – Stage set. Shahzad on stage.")
        s["t"] = now; s["phase"] = 1

    elif s["phase"] == 1 and now - s["t"] >= 2.0:
        _show("Ahriman")
        _move_y("Ahriman", 1200.0)
        print("[Battle] Phase 1 – Ahriman emerges from darkness.")
        s["t"] = now; s["phase"] = 2

    elif s["phase"] == 2 and now - s["t"] >= 1.5:
        _show("AhrimanLight")
        print("[Battle] Phase 2 – Dark light ignites.")
        s["t"] = now; s["phase"] = 3

    elif s["phase"] == 3 and now - s["t"] >= 2.0:
        _show("ShahzadWeapon")
        print("[Battle] Phase 3 – Weapons materialise.")
        s["t"] = now; s["phase"] = 4

    elif s["phase"] == 4 and now - s["t"] >= 1.5:
        _move_y("Shahzad", -200.0)
        print("[Battle] Phase 4 – Shahzad charges!")
        s["t"] = now; s["phase"] = 5

    elif s["phase"] == 5 and now - s["t"] >= 1.0:
        _show("AhrimanAttack")
        _move_y("Ahriman", 800.0)
        print("[Battle] Phase 5 – CLASH! Ahriman attacks.")
        s["t"] = now; s["phase"] = 6

    elif s["phase"] == 6 and now - s["t"] >= 1.5:
        _hide("AhrimanAttack")
        _move_y("Ahriman", 1600.0)
        print("[Battle] Phase 6 – Ahriman recoils.")
        s["t"] = now; s["phase"] = 7

    elif s["phase"] == 7 and now - s["t"] >= 1.0:
        _hide("AhrimanLight")
        actors = _tag("ShahzadWeapon")
        offsets = [-400.0, 0.0, 400.0]
        for i, a in enumerate(actors[:3]):
            loc = a.get_actor_location()
            a.set_actor_location(unreal.Vector(loc.x, offsets[i], loc.z + 100.0), False, False)
        print("[Battle] Phase 7 – Victory! Shahzad stands.")
        s["phase"] = 8

    elif s["phase"] == 8:
        if s["handle"]:
            unreal.unregister_slate_post_tick_callback(s["handle"])
            s["handle"] = None
        print("[Battle] SEQUENCE COMPLETE.")

_state["handle"] = unreal.register_slate_post_tick_callback(_tick)
print("[Battle] Sequence started — 8 phases, ~12s total.")
