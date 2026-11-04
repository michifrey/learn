# Lernen – Anleitung für Claude

Statische Lern-App (GitHub Pages, kein Build). Schüler:innen der 1.–9. Klasse (Aargau: Primar 1–6, Oberstufe 7–9 mit **Bez / Sek / Real**) lernen hier mit Inhalten, die aus hochgeladenem Unterrichtsmaterial erstellt werden.

## Wenn neues Material kommt

Material liegt in `material/klasse-<n>[-<stufe>]/<fach>/<thema>/` (oder wird im Chat angehängt – dann dorthin kopieren). Daraus erstellst du **ein Thema**:

1. **Alles lesen** (PDF: `pdftotext -layout`, Bilder ansehen). Lernziele sind das Wichtigste – übernimm sie im **Originalwortlaut und in Originalreihenfolge**. Gibt es keine, leite 6–14 Lernziele aus dem Material ab.
2. **Abbildungen** zum Beschriften aus PDFs ausschneiden (`pdftoppm -r 200`, mit PIL zuschneiden, JPG ≤ 900 px, ~80 % Qualität) nach `content/img/<thema-id>/`. Einfache Skizzen (Mathe) lieber als SVG mit weissem Hintergrund zeichnen.
3. **Themen-Datei** `content/themen/<fach>-<thema>.json` schreiben (Schema unten) und das Thema in `content/index.json` unter `themen` eintragen (`fach`, `klasse`, `stufen` – leer = alle Stufen).
4. Material-PDFs als `quellen` verlinken.
5. `python3 tools/validate.py --fix` ausführen (prüft alles und aktualisiert die Kennzahlen im Index). Lokal ansehen: `python3 -m http.server`.

### Umfang pro Thema (Richtwert)

- **lernen**: 1 Kapitel pro Lernziel bzw. Unterthema, kindgerecht, mit Beispielen, Merke-/Achtung-Boxen, Abbildungen. Letztes Kapitel gern ein Merkblatt.
- **lernziele**: jedes mit `antwort` (Lernspick: kurz, mit Fachbegriffen) und `frage` (für die Karteikarte).
- **karten**: 10–20 zusätzliche Karteikarten (Begriffe, Formeln).
- **uebungen**: 2–4 pro Lernziel, gemischte Typen, möglichst automatisch korrigierbar. Jede mit `lernziel`.
- **pruefungen**: mind. eine Testprüfung im Stil der Schule (Richtzeit, Punkte pro Aufgabe, Reihenfolge der Lernziele, Bewertungsraster bei offenen Aufgaben). Wenn eine Original-Probeprüfung dabei ist: diese abbilden und zusätzlich eine neue mit anderen Zahlen/Beispielen.

### Sprache & Stil

Schweizer Hochdeutsch: **ss statt ß**, Dezimalpunkt in Lösungen erlaubt (Eingabe akzeptiert Komma und Punkt). Du-Form, kurze Sätze, Fachbegriffe fett. Stufe beachten: Real einfacher und mit mehr Hilfen, Bez anspruchsvoller.

## Schema

```jsonc
{
  "quellen":   [{ "titel": "…", "art": "Arbeitsblatt", "seiten": 3, "datei": "material/…/x.pdf" }],
  "lernziele": [{ "id": "1", "nr": "1", "gruppe": "Abschnitt", "kurz": "Kurztitel", "text": "Ich kann …", "frage": "Karteikartenfrage", "antwort": "Kurzantwort", "bild": "optional" }],
  "lernen":    [{ "id": "slug", "titel": "…", "lernziele": ["1"], "intro": "…", "bloecke": [ /* Blöcke */ ] }],
  "karten":    [{ "vorne": "…", "hinten": "…" }],
  "uebungen":  [ /* Aufgaben */ ],
  "pruefungen":[{ "id": "slug", "titel": "…", "richtzeit": 45, "hinweis": "…", "aufgaben": [ /* Aufgaben, optional "nr": "3a", "abschnitt": "Teil 1" */ ] }]
}
```

**Blöcke** (`t`): `p` · `h` · `merke` {titel?, text} · `achtung` · `formel` {text, notiz?} · `liste` {items} · `schritte` {titel?, items} · `tabelle` {kopf?, zeilen} · `beispiel` {titel?, aufgabe?, zeilen, notiz?} · `bild` {src, alt, caption?, klein?} · `spalten` {spalten: [[Blöcke], [Blöcke]]}. Text erlaubt `**fett**`, `*kursiv*`, `` `code` `` und `\n`.

**Aufgaben** – gemeinsam: `id`, `typ`, `frage`, `lernziel`, optional `titel`, `punkte`, `bild`, `hilfe` (Tipp), `erklaerung` (nach dem Lösen).

| typ | Felder | Korrektur |
|---|---|---|
| `mc` | `optionen`, `richtig` (Index oder Liste → Mehrfachauswahl), `mischen: false` | automatisch |
| `zahl` | `antwort`, `toleranz` (Standard 0.05), `einheit`, `vor` (z. B. "c ="), `auchRichtig` | automatisch |
| `luecke` | `text` mit `{{0}}`, `{{1}}` …, `luecken` (je Liste akzeptierter Antworten), `woerter` (optional Wortbank) | automatisch, Teilpunkte |
| `zuordnen` | `paare` [[links, rechts]], `ablenker` | automatisch, Teilpunkte – ideal zum Beschriften von Abbildungen ("Nr. 1" → "Zellwand") |
| `reihenfolge` | `items` in richtiger Reihenfolge | automatisch, Teilpunkte |
| `offen` | `musterloesung` (Text oder Zeilen), `kriterien` [{text, punkte}], `skizze: true`, `loesungBild`, `zeilen` | Selbstbewertung nach Kriterien |

Note in der App: `1 + 5 · Punkte / Maximum`.
