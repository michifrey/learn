# 🎓 Lernen

Lern-App für die 1. bis 9. Klasse (Primar · Bez · Sek · Real). Aus hochgeladenem Unterrichtsmaterial entstehen Lerninhalte, Lernziele mit Antworten, Karteikarten, Übungen und Testprüfungen. Statische Seite auf GitHub Pages – gleicher Aufbau wie [books](https://github.com/michifrey/books): reines HTML/CSS/JS, kein Build-Schritt.

## Funktionen

- **Klasse & Stufe wählen** (ab der 7. Klasse Bez/Sek/Real) → passende Fächer und Themen
- Pro Thema:
  - **Lernen** – Kapitel mit Erklärungen, Beispielen, Merke-Boxen und Abbildungen
  - **Lernziele** – Lernspick zum Aufdecken, druckbar, mit Fortschritt pro Lernziel
  - **Karteikarten** – umdrehen, «Gewusst / Fast / Nochmal» (einfache Lernboxen)
  - **Üben** – Multiple Choice, Zahlen, Lückentext, Zuordnen/Beschriften, Reihenfolge, offene Fragen mit Selbstbewertung; Filter nach Lernziel, «nur noch nicht gekonnte»
  - **Testprüfung** – mit Richtzeit/Uhr, Punkten, automatischer Korrektur, Bewertungsraster für offene Aufgaben, **Note** und «Das solltest du nochmals anschauen»; leer oder mit Lösungen **ausdruckbar**
  - **Material** – die Original-Unterlagen
- Hell/Dunkel, mobil optimiert; Fortschritt bleibt im Browser (localStorage)

## Neues Material → neuer Lerninhalt

1. Unterlagen hochladen nach `material/klasse-<n>[-bez|-sek|-real]/<fach>/<thema>/` (GitHub: *Add file → Upload files*) oder direkt im Chat an Claude anhängen.
2. Claude Code mit diesem Repo: *«Ich habe neues Material hochgeladen: material/…  Bitte erstelle daraus Lerninhalt und eine Testprüfung.»*
3. Claude erstellt `content/themen/<id>.json` (+ Abbildungen) nach der Anleitung in [`CLAUDE.md`](CLAUDE.md) und öffnet einen PR. Nach dem Merge ist das Thema online.

## Aufbau

```
index.html, assets/        App
content/index.json         Stufen, Fächer, Themenliste
content/themen/*.json      ein Thema = Lernziele, Kapitel, Karten, Übungen, Prüfungen
content/img/<thema>/       Abbildungen
material/                  Original-Unterlagen (PDF, Fotos)
tools/validate.py          prüft alle Inhalte (läuft auch in GitHub Actions)
```

## Lokal ansehen

```bash
python3 -m http.server 8000
```

## Veröffentlichen

1. Branch nach `main` mergen.
2. Im Repo unter **Settings → Pages → Build and deployment → Source** «GitHub Actions» wählen.
3. Der Workflow `.github/workflows/pages.yml` prüft die Inhalte und deployt bei jedem Push auf `main` → `https://michifrey.github.io/learn/`.

## Inhalte bisher

| Klasse | Fach | Thema |
|---|---|---|
| 8 | Mathematik | Satz des Pythagoras (12 Kapitel, 37 Übungen, Probeprüfung 40 P + Schnelltest 30 P) |
| 8 | Biologie / NT | Kapitel 8: Wachstum von Pflanzen (14 Lernziele, 41 Übungen, Testprüfung 80 P) |
| 8 | Musik | Quintenzirkel (10 Lernziele, 11 Kapitel, 40 Übungen, Testprüfung 40 P + 12-seitiges Dossier) |

## Prisma 1-3: Natur und Technik

Die öffentliche Themenübersicht ist mit allen **21 Themen für Klasse 7-9** hinterlegt (`content/prisma.json`). Unter Natur und Technik stehen die sieben Themen von Prisma 1 und die sechs Themen von Prisma 3 vorerst als **Geplant**. Diese Einträge zeigen eine Vorschau ohne leere Übungs- oder Prüfungsansichten.

Für **Prisma 2 / Klasse 8** sind alle acht Themen verfügbar. Das bestehende Pflanzenthema behält seine 14 schulischen Lernziele. Die sieben neuen Themen bieten jeweils **8 eigene Lernziele, 9 Kapitel einschliesslich Lernspick, 12 zusätzliche Begriffskarten, 24 Übungen, eine Testprüfung mit 32 Punkten sowie ein 12-seitiges PDF-Dossier**:

- Atombau und Periodensystem
- Chemische Reaktionen
- Ein Mensch entsteht
- Gesundheit und Krankheit
- Kräfte und Bewegung
- Ernährung und Verdauung
- Nervensystem, Akustik und Optik

Die neuen Texte, Aufgaben und SVG-Skizzen wurden eigenständig erstellt. Die Themenübersicht dient als Orientierung; die Inhalte bilden das Lehrbuch nicht vollständig ab. Noch nicht mit den Prüfungszielen der Schule abgeglichene Lernziele sind in der App und im PDF als **Eigene Lernziele** gekennzeichnet. Fachliche Referenzen stehen in den Themen und Dossiers.

Prüfen:

```bash
python3 tools/validate.py
node tools/test_prisma.cjs
```

## Ideen

- [ ] Mehrere Kinder/Profile auf einem Gerät
- [ ] Fortschritt exportieren/teilen
- [ ] Spaced Repetition über mehrere Tage
- [ ] Hörtexte/Vokabeltrainer für Sprachen



## Mathematik 2: Grundlagen auf Niveau III

Neun eigene Grundlagen-Dossiers für Klasse 8 orientieren sich an der [öffentlichen LMVZ-Themenübersicht](https://003.lmvz.ch/lehrmittelsites/mathe_sek/de/m2/index.html). Das genannte Arbeitsheft III hat ISBN 978-3-03713-508-2. Die Kapitelbündel und Lernziele sind selbst formuliert und noch nicht mit dem Arbeitsheft oder den Prüfungszielen der Schule vollständig abgeglichen. Niveau III wird nicht automatisch einer Aargauer Schulstufe gleichgesetzt; die Inhalte sind in allen Profilen der Klasse 8 sichtbar.

1. Brüche, Gleichungen und Wurzeln (einschliesslich Zahlenfolgen)
2. Thales und Pythagoras
3. Zuordnungen und Proportionalität
4. Prisma und Pyramide
5. Preise, Währungen und Budget (einschliesslich Rabatt und Mehrwertsteuer)
6. Kreis und Kreissektor
7. Wahrscheinlichkeit und Statistik
8. Zylinder
9. Geschwindigkeit, Steigung und Gefälle

Je Thema: **8 Lernziele, 9 Lernkapitel mit Lernspick, 12 Zusatzkarten, 24 Übungen, ein Test mit 32 Punkten und ein 12-seitiges PDF**. Die PDFs enthalten drei Lernseiten, einen A4-Lernspick, zwei Übungsblätter, eine dreiseitige Testprüfung und zwei Lösungsseiten. 18 eigene SVGs bieten Lernskizzen und Vorlagen zum Beschriften.

Das bisherige Pythagoras-Thema mit 37 Übungen und zwei Prüfungen bleibt als zusätzliches Thema erhalten. Steuersätze und Wechselkurse sind ausdrücklich vorgegebene Rechenbeispiele. Für Kreise wird mit der π-Taste gerechnet; Ergebnisse werden erst am Schluss gerundet.

Zusätzliche Prüfung: `node tools/test_mathematik2.cjs` (Rechnungen unabhängig nachgerechnet, Korrektur positiver/falscher Eingaben, Dezimalkomma und offene Punkteraster).

## Deutsch Primarschule

Drei eigene Pakete zu den hochgeladenen Unterlagen: Blitzlesen für Klasse 1 und 2 (gleicher Inhalt in zwei Klassenansichten; 8 Ziele, 24 Übungen, Lernkontrolle 16 P, Dossier 12 Seiten), Deutsch Grundlagen für Klasse 2 (12 Ziele, 36 Übungen, Lernkontrolle 24 P, Dossier 14 Seiten) und direkte/indirekte Rede für Klasse 3 (8 Ziele, 24 Übungen, eigener Test 32 P und überarbeitete Klassenarbeit nach der Vorlage 45 P, Dossier 12 Seiten mit dem eigenen Test).

Alle Pakete enthalten Erklärungen, Lernspick, Arbeitsblätter und Lösungen. Die Lernziele wurden selbst formuliert. Bei Blitzlesen hat Genauigkeit Vorrang vor Tempo; eine Begleitperson hört bei der Lesekontrolle zu. Die App misst keine Lesegeschwindigkeit. Indirekte Rede wird mit einfachen dass-Sätzen eingeführt; Konjunktiv ist Zusatzwissen. Die bearbeitete Klassenarbeit folgt den zehn Aufgabengruppen der Vorlage, mit neuem Gitter, gekürztem Dialog und korrigierten Lösungen. Originalsammlungen werden nicht im öffentlichen Repository veröffentlicht; ihre Dateinamen stehen in herkunft.dateien, quellen verlinkt die eigenen Dossiers.

Lückentexte mit `exakt: true` prüfen Gross-/Kleinschreibung, Umlaute und Satzzeichen. Äussere Leerzeichen und Unicode-Normalform werden vereinheitlicht. Ohne Flag bleibt die bisherige tolerante Korrektur erhalten. Prüfung: `node tools/test_deutsch_primar.cjs`.

## Deutsch Klasse 5 und 6

Zwei weitere eigene Pakete, jeweils für Klasse 5 und Klasse 6 sichtbar, mit 12 Lernzielen, 13 Lernkapiteln, 12 Zusatzkarten, 36 Übungen, eigenem Test (48 P) und 15-seitigem Dossier. Kommas und Zeichensetzung bündelt die überlappenden Königspakete und ergänzt zwei überarbeitete Vorlagentests (25 P und 28 P) in der App. Rechtschreibung bündelt die Sammlung 2: als/wie, Apostroph, das/dass, Dehnung/Schärfung, getrennt/zusammen, Grossschreibung, im/ihm/in/ihn, seit/seid, wen/wenn, wieder/wider und Wortproben. Kommaübungen aus dieser Sammlung werden im gemeinsamen Zeichenpaket behandelt.

Regelabgleich mit dem Amtlichen Regelwerk 2024 (grammis/IDS). Satzwertige Infinitivgruppen werden als Nebensätze abgetrennt; nicht erweiterte Infinitive und mehrteilige Prädikate haben Ausnahmen. Partizipgruppen sind nicht pauschal kommapflichtig. Der nachgebildete Kommatest erhält wegen des nun verlangten Kommas nach nicht vor keine Angst zu haben 25 statt 24 Punkte. Die Vorlagentests stehen in der App; die PDFs enthalten den eigenen Test. Beide Jahrgänge teilen denselben Inhalt; Kapitel zu Infinitiven und Partizipien sind anspruchsvollere Vertiefung.
