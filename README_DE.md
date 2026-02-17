# Versicherungs-Lernprogramm 2026

Ein interaktives Lernprogramm für die IHK-Sachkundeprüfung §34d GewO (Versicherungsfachmann).

## 🚀 Schnellstart (Windows)

### Einfacher Start mit start.bat

1. Doppelklick auf `start.bat`
2. Der Server startet automatisch auf `http://localhost:3000`
3. Die Anwendung öffnet sich im Browser

Die `start.bat` Datei übernimmt automatisch:
- ✅ Node.js Prüfung
- ✅ Installation der Abhängigkeiten (falls nötig)
- ✅ Start des Entwicklungsservers auf localhost

### Manuelle Installation

Wenn Sie die Anwendung manuell starten möchten:

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. API-Schlüssel konfigurieren
# Bearbeiten Sie .env.local und fügen Sie Ihren Gemini API-Schlüssel ein
# GEMINI_API_KEY=your_api_key_here

# 3. Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

## 📊 Neue Features

### Lernfortschritt-Tracking

Die Anwendung speichert automatisch Ihren Lernfortschritt:

- **Dashboard-Statistiken**: Überblick über alle beantworteten Fragen
- **Modulspezifischer Fortschritt**: Fortschrittsbalken für jedes Lernfeld
- **Erfolgsquote**: Prozentuale Darstellung richtiger Antworten
- **Verlaufshistorie**: Alle Antworten werden mit Zeitstempel gespeichert

### Richtig/Falsch-Übersicht

- ✅ **Richtige Antworten**: Grün hervorgehoben mit Anzahl
- ❌ **Falsche Antworten**: Rot hervorgehoben mit Anzahl
- 📊 **Erfolgsquote pro Modul**: Zeigt Ihre Stärken und Schwächen

### Fragenreihenfolge

Zwei Modi für Fragen:
- **Zufällig**: Fragen werden in zufälliger Reihenfolge gestellt
- **Fortlaufend**: Fragen folgen einer festgelegten Reihenfolge

### Prüfungssimulation

Ein realistischer Prüfungsmodus mit:

- **10 Prüfungsfragen**: Umfangreichere Prüfung als im Übungsmodus
- **Zeiterfassung**: Misst die benötigte Zeit
- **Keine sofortige Erklärung**: Wie in der echten Prüfung
- **Detaillierte Auswertung**: 
  - Bestanden/Nicht bestanden (70% Schwelle)
  - Fragenübersicht mit richtigen/falschen Antworten
  - Vergleich Ihrer Antworten mit den korrekten Antworten
- **Automatischer Fortschritt**: Schneller Ablauf ohne manuelle Bestätigung

### Übungsmodus

Der Standard-Lernmodus mit:

- **5 Übungsfragen**: Schnelles Training
- **Sofortige Erklärung**: Nach jeder Antwort
- **Detaillierte Lösungswege**: Verständnis aufbauen
- **Flexible Fragenreihenfolge**: Wählbar vor Start

## 🎯 Nutzung

### Dashboard

Das Dashboard zeigt:
1. **Gesamtstatistiken**: Fragen beantwortet, richtig, falsch, Erfolgsquote
2. **Modulkarten**: Jedes Lernfeld mit individuellem Fortschritt
3. **Fortschritt zurücksetzen**: Button zum Löschen aller gespeicherten Daten

### Lernmodi

Jedes Modul bietet 4 Modi:

1. **Theorie & Wissen**: KI-generierte Lerninhalte
2. **Prüfungstraining**: Übungs- oder Prüfungsmodus
3. **Rechen-Labor**: Komplexe Berechnungen üben
4. **Tutor Chat**: Fragen an den KI-Tutor

### Prüfungstraining

Beim Klick auf "Prüfungstraining" können Sie wählen:

- **Übungsmodus**: 5 Fragen mit Erklärungen
- **Prüfungssimulation**: 10 Fragen im Prüfungsformat

Vor dem Start können Sie die Fragenreihenfolge festlegen.

## 💾 Datenspeicherung

Alle Fortschritte werden lokal im Browser gespeichert (localStorage):

- Keine Server-Übertragung
- Daten bleiben auf Ihrem Computer
- Bei Bedarf komplett löschbar
- Funktioniert auch offline (nach erstem Laden)

## 🔧 Technische Details

- **Framework**: React 19 + TypeScript
- **Build-Tool**: Vite 6
- **Styling**: Tailwind CSS
- **KI-Integration**: Google Gemini API
- **Icons**: Lucide React

## 📝 Hinweise

- Für die KI-Funktionen wird ein Gemini API-Schlüssel benötigt
- Der Schlüssel muss in `.env.local` hinterlegt werden
- Sie können einen kostenlosen Schlüssel auf https://ai.google.dev/ erhalten

## 🆘 Problemlösung

### Server startet nicht

- Prüfen Sie, ob Node.js installiert ist: `node --version`
- Installieren Sie Node.js von https://nodejs.org/

### Build-Fehler

```bash
# Löschen Sie node_modules und installieren Sie neu
rm -rf node_modules
npm install
```

### API-Fehler

- Überprüfen Sie, ob der API-Schlüssel korrekt in `.env.local` eingetragen ist
- Starten Sie den Server neu nach Änderungen an `.env.local`

## 📜 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt.
