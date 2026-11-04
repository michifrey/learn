#!/usr/bin/env python3
"""Prüft content/index.json und alle Themen-Dateien.

    python3 tools/validate.py          # nur prüfen (CI)
    python3 tools/validate.py --fix    # zusätzlich "angebot" im Index aktualisieren
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
TYPES = {"mc", "zahl", "luecke", "zuordnen", "reihenfolge", "offen"}
BLOCKS = {"p", "h", "merke", "achtung", "formel", "liste", "schritte", "tabelle", "beispiel", "bild", "svg", "spalten"}

errors = []


def err(where, msg):
    errors.append(f"{where}: {msg}")


def exists(path):
    return os.path.exists(os.path.join(ROOT, path))


def max_punkte(a):
    if "punkte" in a:
        return a["punkte"]
    if a.get("typ") == "offen":
        return sum(k["punkte"] for k in a.get("kriterien", [])) or 1
    return 1


def check_aufgabe(where, a, lz_ids):
    typ = a.get("typ")
    if typ not in TYPES:
        return err(where, f"unbekannter typ {typ!r}")
    if not a.get("id"):
        err(where, "id fehlt")
    if not a.get("frage"):
        err(where, "frage fehlt")
    lz = a.get("lernziel")
    for l in (lz if isinstance(lz, list) else [lz] if lz else []):
        if l not in lz_ids:
            err(where, f"lernziel {l!r} existiert nicht")
    for key in ("bild", "loesungBild"):
        if a.get(key) and not exists(a[key]):
            err(where, f"{key} fehlt: {a[key]}")
    if typ == "mc":
        opts = a.get("optionen", [])
        r = a.get("richtig")
        rs = r if isinstance(r, list) else [r]
        if len(opts) < 2 or any(not isinstance(i, int) or i >= len(opts) for i in rs):
            err(where, "mc: optionen/richtig ungültig")
    elif typ == "zahl":
        if not isinstance(a.get("antwort"), (int, float)):
            err(where, "zahl: antwort muss eine Zahl sein")
    elif typ == "luecke":
        n = len(re.findall(r"\{\{(\d+)\}\}", a.get("text", "")))
        if n == 0 or n != len(a.get("luecken", [])):
            err(where, f"luecke: {n} Platzhalter, aber {len(a.get('luecken', []))} Lösungslisten")
    elif typ == "zuordnen":
        if len(a.get("paare", [])) < 2:
            err(where, "zuordnen: mindestens 2 paare")
        lefts = [p[0] for p in a.get("paare", [])]
        if len(set(lefts)) != len(lefts):
            err(where, "zuordnen: linke Seiten müssen eindeutig sein")
    elif typ == "reihenfolge":
        if len(a.get("items", [])) < 2:
            err(where, "reihenfolge: mindestens 2 items")
    elif typ == "offen":
        if not a.get("musterloesung"):
            err(where, "offen: musterloesung fehlt")


def check_block(where, b):
    if b.get("t") not in BLOCKS:
        err(where, f"unbekannter Block {b.get('t')!r}")
    if b.get("t") == "bild" and not exists(b.get("src", "")):
        err(where, f"Bild fehlt: {b.get('src')}")
    for col in b.get("spalten", []):
        for bb in col:
            check_block(where, bb)


def main():
    fix = "--fix" in sys.argv
    with open(os.path.join(CONTENT, "index.json"), encoding="utf-8") as f:
        index = json.load(f)
    faecher = {f["id"] for f in index["faecher"]}
    stufen = {s["id"] for s in index["stufen"]}
    seen = set()
    total = {"themen": 0, "uebungen": 0, "pruefungen": 0}
    for t in index["themen"]:
        w = f"index/{t.get('id')}"
        if t["id"] in seen:
            err(w, "doppelte id")
        seen.add(t["id"])
        if t["fach"] not in faecher:
            err(w, f"fach {t['fach']!r} unbekannt")
        if not (1 <= t["klasse"] <= 9):
            err(w, "klasse muss 1–9 sein")
        for s in t.get("stufen", []):
            if s not in stufen:
                err(w, f"stufe {s!r} unbekannt")
        path = os.path.join(CONTENT, t["datei"])
        try:
            with open(path, encoding="utf-8") as f:
                topic = json.load(f)
        except Exception as e:  # noqa: BLE001
            err(w, f"Datei {t['datei']} nicht lesbar: {e}")
            continue
        lz_ids = {lz["id"] for lz in topic.get("lernziele", [])}
        for q in topic.get("quellen", []):
            if not exists(q["datei"]):
                err(w, f"Quelle fehlt: {q['datei']}")
        for k in topic.get("lernen", []):
            for b in k.get("bloecke", []):
                check_block(f"{w}/lernen/{k['id']}", b)
            for l in k.get("lernziele", []):
                if l not in lz_ids:
                    err(f"{w}/lernen/{k['id']}", f"lernziel {l!r} existiert nicht")
        ids = set()
        for a in topic.get("uebungen", []):
            check_aufgabe(f"{w}/uebungen/{a.get('id')}", a, lz_ids)
            if a.get("id") in ids:
                err(w, f"doppelte Aufgaben-id {a.get('id')}")
            ids.add(a.get("id"))
        for ex in topic.get("pruefungen", []):
            pts = 0
            for a in ex.get("aufgaben", []):
                check_aufgabe(f"{w}/pruefung/{ex['id']}/{a.get('id')}", a, lz_ids)
                pts += max_punkte(a)
            print(f"  {t['id']} · {ex['titel']}: {len(ex['aufgaben'])} Aufgaben, {pts:g} Punkte, {ex.get('richtzeit')} Min.")
        angebot = [
            f"{len(topic.get('lernen', []))} Kapitel",
            f"{len(topic.get('uebungen', []))} Übungen",
            f"{len(topic.get('pruefungen', []))} Prüfung{'en' if len(topic.get('pruefungen', [])) != 1 else ''}",
        ]
        if fix:
            t["angebot"] = angebot
        total["themen"] += 1
        total["uebungen"] += len(topic.get("uebungen", []))
        total["pruefungen"] += len(topic.get("pruefungen", []))
    if fix:
        with open(os.path.join(CONTENT, "index.json"), "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
            f.write("\n")
    if errors:
        print("\n".join(f"✗ {e}" for e in errors))
        sys.exit(1)
    print(f"✓ {total['themen']} Themen, {total['uebungen']} Übungen, {total['pruefungen']} Prüfungen OK")


if __name__ == "__main__":
    main()
