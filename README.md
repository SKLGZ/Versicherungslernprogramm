<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Versicherungslernprogramm - Profi §34d Edition 2026

Eine moderne Lern-App für die IHK-Sachkundeprüfung nach §34d GewO mit umfassender PDF-Unterstützung und KI-gestützten Lernfunktionen.

## 🚀 Neue Features: PDF-Upload und -Verarbeitung

### PDF-Bibliothek
- 📤 **Drag & Drop Upload** - Einfaches Hochladen von PDF-Dateien
- 📚 **Kategorisierung** - Ordne PDFs nach Lehrmaterial, Rechnungen, Zertifikaten
- 🔍 **Volltextsuche** - Durchsuche alle hochgeladenen PDFs nach Inhalten
- 📖 **Kapitel-Navigation** - Automatische Erkennung und Navigation durch Kapitel
- 📝 **Notizen & Lesezeichen** - Füge Notizen hinzu und markiere wichtige Stellen
- 💾 **Offline-Verfügbar** - Alle PDFs werden lokal gespeichert (IndexedDB)
- 📥 **Export/Import** - Sichere deine Daten als Backup

### KI-Integration
- 🤖 **Zusammenfassungen** - Automatische Kapitel-Zusammenfassungen
- ❓ **Quiz-Generierung** - Erstelle Prüfungsfragen aus PDF-Inhalten
- 🧮 **Rechenaufgaben** - Generiere Übungsaufgaben basierend auf dem Material
- 💬 **Chat-Tutor** - Stelle Fragen zu deinen PDF-Inhalten

### Lernmodi
- 📘 **Theorie & Wissen** - Strukturierte Lerninhalte
- ✅ **Prüfungstraining** - Multiple-Choice-Fragen im IHK-Stil
- 🔢 **Rechen-Labor** - Komplexe Berechnungsaufgaben
- 💬 **Tutor Chat** - Interaktiver KI-Tutor

## 📋 Voraussetzungen

- Node.js (v18 oder höher)
- Gemini API Key von Google AI Studio

## 🛠️ Installation & Setup

1. **Repository klonen:**
   ```bash
   git clone https://github.com/SKLGZ/Versicherungslernprogramm.git
   cd Versicherungslernprogramm
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen einrichten:**
   
   Erstelle eine `.env.local` Datei im Root-Verzeichnis:
   ```
   GEMINI_API_KEY=dein_api_key_hier
   ```

4. **Development Server starten:**
   ```bash
   npm run dev
   ```
   
   Die App ist dann unter `http://localhost:3000` verfügbar.

5. **Production Build erstellen:**
   ```bash
   npm run build
   npm run preview
   ```

## 📦 Verwendete Technologien

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Google Generative AI** - KI-Funktionen
- **pdfjs-dist** - PDF-Verarbeitung
- **IndexedDB (idb)** - Lokaler Datenspeicher
- **Fuse.js** - Fuzzy-Search
- **Lucide React** - Icons

## 📖 Verwendung

### PDF hochladen

1. Klicke auf **"PDF Bibliothek"** in der Seitenleiste
2. Wähle eine Kategorie (Lehrmaterial, Rechnung, Zertifikat, Sonstiges)
3. Ziehe eine PDF-Datei in den Upload-Bereich oder klicke auf "Datei auswählen"
4. Warte auf die automatische Verarbeitung

### PDF lesen und lernen

1. Öffne ein PDF aus der Bibliothek
2. Navigiere durch Kapitel über das Inhaltsverzeichnis
3. Passe die Schriftgröße an (Zoom-Buttons oben)
4. Füge Lesezeichen und Notizen hinzu
5. Nutze die Suchfunktion für spezifische Inhalte

### KI-Features nutzen

1. **Quiz generieren**: Wähle ein Modul und starte das Prüfungstraining
2. **Zusammenfassungen**: Gib im Theorie-Modus ein Thema ein
3. **Rechen-Aufgaben**: Nutze den Rechen-Labor-Modus
4. **Chat-Tutor**: Stelle direkte Fragen im Chat-Modus

## 🗂️ Projektstruktur

```
Versicherungslernprogramm/
├── components/          # React-Komponenten
│   ├── PDFUpload.tsx
│   ├── PDFViewer.tsx
│   ├── ChapterNavigation.tsx
│   └── SearchBar.tsx
├── hooks/               # Custom React Hooks
│   └── usePDFContent.ts
├── utils/               # Utility-Funktionen
│   ├── storage.ts       # IndexedDB-Operationen
│   ├── pdfParser.ts     # PDF-Verarbeitung
│   └── aiAnalyzer.ts    # KI-Funktionen
├── types/               # TypeScript-Definitionen
│   └── pdf.ts
├── index.tsx            # Haupt-App-Komponente
├── index.html           # HTML-Template
└── vite.config.ts       # Vite-Konfiguration
```

## 🔐 Datenschutz & Sicherheit

- Alle PDFs werden **lokal im Browser** gespeichert (IndexedDB)
- Keine Cloud-Synchronisation - deine Daten bleiben auf deinem Gerät
- Export/Import-Funktion für manuelles Backup
- Sichere API-Key-Verwaltung über Umgebungsvariablen

## 🐛 Bekannte Probleme

- Sehr große PDF-Dateien (>50MB) können langsam verarbeitet werden
- Die automatische Kapitel-Erkennung funktioniert am besten mit strukturierten PDFs

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle einen Issue oder Pull Request.

## 📄 Lizenz

Dieses Projekt ist für Lernzwecke erstellt.

## 🔗 Links

- [AI Studio App](https://ai.studio/apps/drive/1rK0ocheFcjvDqFaeqaa9S_ODEFpXwAgf)
- [Google AI Studio](https://ai.google.dev/aistudio)

## 📞 Support

Bei Fragen oder Problemen erstelle bitte einen Issue auf GitHub.
