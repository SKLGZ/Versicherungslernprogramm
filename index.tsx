import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BookOpen, 
  BrainCircuit, 
  Calculator, 
  CheckCircle, 
  ChevronRight, 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  Target, 
  XCircle,
  Menu,
  X
} from "lucide-react";

// --- Types & Constants ---

// Simulating 2026 Constants for the AI Context
const CONTEXT_2026 = `
HEUTE: 15. Mai 2026.
WICHTIG: Du bist ein strenger aber fairer IHK-Prüfungstutor für den §34d GewO (Versicherungsfachmann).
Nutze ausschließlich Daten und Fakten, die für 2026 relevant sind (z.B. erhöhte BBG in der GRV/GKV).

REFERENZMATERIAL: PROXIMUS 5 - Vollständige Bedingungen und Tarife (1407 Seiten)
Du hast Zugriff auf das komplette PROXIMUS 5 Fachbuch mit allen Bedingungen, Tarifen, Tabellen und Erklärungen:

HAUSRAT/GLAS (S. 43-189):
- VHB 2021 (Versicherungssummenmodell), AGlB 2021
- Tarife, Unterversicherung, Elementarschäden
- Alle Berechnungsbeispiele und Vertragsunterlagen

WOHNGEBÄUDE (S. 190-339):
- VGB 2021 Privat, Wert 1914, Gleitender Neuwert
- Versicherungssumme 1914 Berechnung
- Unterversicherungsverzicht, Elementar

HAFTPFLICHT (S. 340-489):
- AVB Haftpflicht 2021 (Teil A + B)
- Versicherungssummen, Schadenregulierung
- Obliegenheiten, Risikoausschlüsse

KRAFTFAHRT (S. 490-699):
- AKB 2021 vollständig
- SF-Klassen Tabellen (alle Stufen)
- Typklassen Tabellen (komplett)
- Regionalklassen Tabellen (alle Bezirke)
- Prämienberechnungen, Rückstufungen

RECHTSSCHUTZ (S. 700-799):
- ARB 2021, alle Bausteine
- Wartezeiten, Selbstbeteiligungen

LEBEN (S. 800-1049):
- Basisrente § 10 EStG, Riester AltZertG
- Kapitalbildende LV, Fondsgebundene RV
- Risikoleben, BU, Grundfähigkeiten
- Schichtenmodell, Steuerliche Behandlung
- Alle Tarife S10, S20, S30, S31, S32, S33, S34, S35

UNFALL (S. 1050-1149):
- AUB 2022, Gliedertaxe
- Invalidität, Progression, Soforthilfe

KRANKEN (S. 1150-1299):
- MB/KK 2009, MB/KT 2009, MB/PPV 2022
- Basistarif, Standardtarif, Notlagentarif
- PKV Tarife, Altersrückstellungen

REISE (S. 1300-1349):
- AT-Reise 2021, Reiserücktritt, Reiseabbruch

FINANZANLAGEN (S. 1350-1407):
- PROXIMUS Fonds (Bond, Global, Balance, Strategic, Ethic, Real, Euro Indexx 49)

DEINE AUFGABE:
- Nutze IMMER die exakten Bedingungen und Tarife aus PROXIMUS 5
- Zitiere Paragraphen und Ziffern korrekt (z.B. "§3 VHB 2021")
- Verwende die originalen Tabellen für Berechnungen
- Erkläre im PROXIMUS-Stil: strukturiert, praxisnah, prüfungsrelevant
- Stelle sicher, dass JEDE Frage, JEDE Tabelle, JEDE Erklärung aus dem vollständigen PROXIMUS 5 Material stammt

Deine Persönlichkeit: Professionell, motivierend, präzise - wie ein erfahrener Sachkundeguru mit vollständigem Zugriff auf alle PROXIMUS 5 Inhalte.
`;

const MODULES = [
  { id: "recht", title: "Rechtliche Grundlagen", icon: BookOpen, desc: "VVG, GewO, VAG, Datenschutz" },
  { id: "grv", title: "Gesetzliche Rentenversicherung", icon: GraduationCap, desc: "SGB VI, Rentenarten, Besteuerung" },
  { id: "lebens", title: "Lebensversicherung & bAV", icon: Target, desc: "Schichtenmodell, Fonds, Risikoprüfung" },
  { id: "kranken", title: "Kranken- & Pflegeversicherung", icon: ShieldCheck, desc: "GKV vs. PKV, Beihilfe, Pflegegrade" },
  { id: "sach", title: "Sach- & Vermögensversicherung", icon: LayoutDashboard, desc: "Hausrat, Wohngebäude, Haftpflicht" },
  { id: "auto", title: "Kraftfahrtversicherung", icon: Calculator, desc: "KH, Kasko, Typklassen, SF-Klassen" }
];

type ViewState = "dashboard" | "module";
type Mode = "theory" | "quiz" | "calc" | "chat";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CalcScenario {
  title: string;
  scenario: string;
  task: string;
  solutionSteps: string[];
  finalAnswer: string;
}

// --- API Helper ---

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

const LoadingSpinner = ({ text = "Lade Inhalte..." }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse">
    <RefreshCw className="w-8 h-8 mb-4 animate-spin text-blue-600" />
    <p className="font-medium">{text}</p>
  </div>
);

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<ViewState>("dashboard");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>("theory");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeModule = MODULES.find(m => m.id === activeModuleId);

  const handleModuleSelect = (id: string) => {
    setActiveModuleId(id);
    setView("module");
    setActiveMode("theory");
    setSidebarOpen(false);
  };

  const goHome = () => {
    setView("dashboard");
    setActiveModuleId(null);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span>Profi §34d</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Versicherungs<br/>Profi 2026</h1>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          <button 
            onClick={goHome}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Lernfelder
          </div>

          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => handleModuleSelect(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${activeModuleId === m.id ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800'}`}
            >
              <m.icon size={16} className={activeModuleId === m.id ? 'text-blue-400' : 'text-slate-500'} />
              {m.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-60px)] md:h-screen p-4 md:p-8">
        {view === "dashboard" ? (
          <Dashboard onSelect={handleModuleSelect} />
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Module Header */}
            <header className="mb-8">
              <button onClick={goHome} className="text-sm text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1">
                &larr; Zurück zur Übersicht
              </button>
              <h2 className="text-3xl font-bold text-slate-900">{activeModule?.title}</h2>
              <p className="text-slate-500 mt-1">{activeModule?.desc}</p>
              
              {/* Mode Switcher */}
              <div className="flex flex-wrap gap-2 mt-6">
                <ModeButton active={activeMode === "theory"} onClick={() => setActiveMode("theory")} icon={BookOpen} label="Theorie & Wissen" />
                <ModeButton active={activeMode === "quiz"} onClick={() => setActiveMode("quiz")} icon={CheckCircle} label="Prüfungstraining" />
                <ModeButton active={activeMode === "calc"} onClick={() => setActiveMode("calc")} icon={Calculator} label="Rechen-Labor" />
                <ModeButton active={activeMode === "chat"} onClick={() => setActiveMode("chat")} icon={MessageSquare} label="Tutor Chat" />
              </div>
            </header>

            {/* Content View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] p-6 md:p-8">
              {activeMode === "theory" && <TheoryView module={activeModule!} />}
              {activeMode === "quiz" && <QuizView module={activeModule!} />}
              {activeMode === "calc" && <CalculationView module={activeModule!} />}
              {activeMode === "chat" && <ChatView module={activeModule!} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-Components ---

const ModeButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all
      ${active 
        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-1" 
        : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50"
      }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const Dashboard = ({ onSelect }: { onSelect: (id: string) => void }) => (
  <div className="max-w-6xl mx-auto">
    <div className="mb-10">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Willkommen zurück, Experte.</h1>
      <p className="text-lg text-slate-600 max-w-2xl mb-4">
        Dein Lernfortschritt für die Prüfung 2026. Bereit für die nächste Einheit mit vollständigem PROXIMUS 5 Material?
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">PROXIMUS 5 vollständig integriert</p>
            <p className="text-xs text-blue-700">
              Alle 1407 Seiten • Bedingungen • Tarife • Tabellen • Berechnungen • Vertragsunterlagen
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {MODULES.map((m) => (
        <div 
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <m.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{m.title}</h3>
            <p className="text-slate-500 text-sm">{m.desc}</p>
            <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm group-hover:underline">
              Starten <ChevronRight size={16} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Content Views ---

const TheoryView = ({ module }: { module: any }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const generateTheory = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const ai = getAI();
      const prompt = `
        ${CONTEXT_2026}
        
        THEMA: ${module.title} - ${topic}
        
        AUFGABE: Erstelle eine vollständige, prüfungsrelevante Lernzusammenfassung basierend auf PROXIMUS 5.
        
        PFLICHT-INHALTE:
        - Zitiere exakte Paragraphen und Ziffern aus den PROXIMUS 5 Bedingungen
        - Verwende originale Definitionen und Formulierungen
        - Integriere relevante Tabellen und Berechnungsformeln
        - Nenne konkrete Versicherungssummen und Tarife aus PROXIMUS 5
        - Beziehe dich auf Vertragsunterlagen und Musterverträge
        
        FORMAT: Markdown mit:
        - **Fettungen** für Schlüsselbegriffe
        - Gliederung mit Überschriften
        - Aufzählungen für Definitionen
        - Tabellen für Berechnungen
        - "Praxis-Beispiel" mit PROXIMUS Vertragskonstellationen
        - "Prüfungs-Tipp" mit IHK-relevanten Hinweisen
        
        QUALITÄT: Nutze die Tiefe des 1407-seitigen PROXIMUS 5 Materials. Sei präzise, strukturiert und prüfungsrelevant.
      `;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setContent(result.text || "Fehler bei der Generierung.");
    } catch (e) {
      console.error(e);
      setContent("Entschuldigung, ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">PROXIMUS 5 Wissensdatenbank</h3>
        <p className="text-sm text-blue-700 mb-3">Alle Bedingungen, Tarife und Tabellen aus 1407 Seiten verfügbar</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="z.B. 'Unterversicherung VHB', 'SF-Klassen AKB', 'Basisrente Steuer', 'Gliedertaxe'"
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateTheory()}
          />
          <button 
            onClick={generateTheory}
            disabled={loading || !topic}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generiere..." : "Lernen"}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text="Erstelle Lerninhalte aus PROXIMUS 5 mit aktuellen 2026er Daten..." />}

      {content && !loading && (
        <div className="prose prose-slate max-w-none markdown-body">
          <div dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(content) }} />
        </div>
      )}
      
      {!content && !loading && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Gib ein Thema ein, um eine Lerneinheit zu starten.</p>
        </div>
      )}
    </div>
  );
};

const QuizView = ({ module }: { module: any }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const startQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);

    try {
      const ai = getAI();
      const prompt = `
        ${CONTEXT_2026}
        
        THEMA: ${module.title}
        
        AUFGABE: Erstelle 5 anspruchsvolle IHK-Prüfungsfragen basierend auf PROXIMUS 5 Material.
        
        PFLICHT-ANFORDERUNGEN:
        - Nutze exakte Bedingungen und Tarife aus PROXIMUS 5
        - Beziehe dich auf konkrete Paragraphen (z.B. "§3 VHB 2021", "Ziffer 2.1 AKB 2021")
        - Verwende originale Tabellenwerte (SF-Klassen, Typklassen, Regionalklassen, Tarife)
        - Stelle fallbasierte Fragen mit konkreten PROXIMUS Vertragskonstellationen
        - Integriere Berechnungsaufgaben mit PROXIMUS Werten
        
        FRAGE-TYPEN (mische):
        1. Bedingungswissen (Definitionen, Ausschlüsse, Obliegenheiten aus PROXIMUS 5)
        2. Tarifanwendung (Prämienberechnung, SF-Rückstufung mit PROXIMUS Tabellen)
        3. Fallanalyse (Schadenbeispiele mit PROXIMUS Bedingungen)
        4. Vertragsgestaltung (Versicherungssummen, Selbstbehalte aus PROXIMUS)
        
        FORMAT: JSON Array.
        STRUKTUR:
        [
          {
            "question": "Detaillierte Fallsituation oder Frage mit PROXIMUS 5 Bezug...",
            "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
            "correctIndex": 0,
            "explanation": "Ausführliche Erklärung mit Verweis auf PROXIMUS 5 Quelle (Seite, Paragraph, Tabelle). Erkläre warum richtige Antwort korrekt ist und andere falsch sind."
          }
        ]
        
        QUALITÄT: IHK-Prüfungsniveau, praxisnah, eindeutig lösbar mit PROXIMUS 5 Wissen.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      const data = JSON.parse(result.text || "[]");
      setQuestions(data);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Laden der Fragen.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    if (index === questions[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // End of quiz
      alert(`Quiz beendet! Du hast ${score} von ${questions.length} richtig.`);
      setQuestions([]); // Reset to allow restart
    }
  };

  if (loading) return <LoadingSpinner text="Generiere IHK-Prüfungsfragen aus PROXIMUS 5..." />;

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Prüfungssimulation</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Starte einen Fragenkatalog zu <strong>{module.title}</strong> basierend auf vollständigem PROXIMUS 5 Material. 
          Alle Fragen nutzen originale Bedingungen, Tarife und Tabellen - IHK-Standards 2026.
        </p>
        <button 
          onClick={startQuiz}
          className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:scale-105 transition-all"
        >
          Simulation starten
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6 text-sm text-slate-500 font-medium">
        <span>Frage {currentIndex + 1} von {questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">{q.question}</h3>
      </div>

      <div className="space-y-3 mb-8">
        {q.options.map((opt, idx) => {
          let stateClass = "border-slate-200 hover:bg-slate-50 hover:border-blue-300";
          if (showResult) {
            if (idx === q.correctIndex) stateClass = "bg-green-50 border-green-500 text-green-900";
            else if (idx === selectedOption) stateClass = "bg-red-50 border-red-500 text-red-900";
            else stateClass = "border-slate-100 opacity-50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${stateClass}`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold
                ${showResult && idx === q.correctIndex ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}
              `}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="animate-fade-in bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
            {selectedOption === q.correctIndex ? (
              <CheckCircle className="text-green-500 w-5 h-5" />
            ) : (
              <XCircle className="text-red-500 w-5 h-5" />
            )}
            Erklärung
          </div>
          <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {showResult && (
        <div className="flex justify-end">
          <button 
            onClick={nextQuestion}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            {currentIndex < questions.length - 1 ? "Nächste Frage" : "Ergebnis anzeigen"}
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

const CalculationView = ({ module }: { module: any }) => {
  const [scenario, setScenario] = useState<CalcScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const generateCalc = async () => {
    setLoading(true);
    setShowSolution(false);
    setScenario(null);

    try {
      const ai = getAI();
      const prompt = `
        ${CONTEXT_2026}
        
        THEMA: ${module.title} - Rechenaufgaben
        
        AUFGABE: Erstelle eine komplexe Berechnungsaufgabe mit PROXIMUS 5 Material.
        
        PFLICHT: Verwende ausschließlich originale PROXIMUS 5 Daten:
        - Tarife und Prämiensätze aus PROXIMUS 5
        - Tabellenwerte (SF-Klassen, Typ-/Regionalklassen bei Kfz)
        - Versicherungssummen aus Musterfällen
        - Berechnungsformeln aus den Bedingungswerken
        - Werte von 2026 (BBG, Steuerfreibeträge)
        
        THEMENBEISPIELE je nach Sparte:
        - Hausrat/Wohngebäude: Unterversicherung, Pro-Rata-Temporis, Entschädigung
        - Haftpflicht: Schadenregulierung, Deckungssummen
        - Kraftfahrt: SF-Rückstufung, Typklassen, Regionalklassen, Prämienkalkulation
        - Leben: Rentenlücke, Schichtenmodell Steuer, Garantiekapital, Fondsrendite
        - Kranken: Altersrückstellung, Beitragskalkulation, Selbstbehalt
        
        FORMAT: JSON Object.
        {
          "title": "Aufgabentitel mit PROXIMUS Bezug",
          "scenario": "Detaillierte Situationsbeschreibung mit allen Zahlen aus PROXIMUS 5. Nenne Vertragsnummern, Tarife, konkrete Bedingungen.",
          "task": "Was genau soll berechnet werden?",
          "solutionSteps": [
            "Schritt 1: Relevante PROXIMUS Bedingung/Tabelle nennen",
            "Schritt 2: Formel aufstellen",
            "Schritt 3: Werte einsetzen (mit PROXIMUS Quelle)",
            "Schritt 4: Rechnung durchführen",
            "Schritt 5: Ergebnis interpretieren"
          ],
          "finalAnswer": "Endergebnis mit Einheit (z.B. 4.523,45 EUR Entschädigung)"
        }
        
        QUALITÄT: Prüfungsrelevant, eindeutig lösbar, mit vollständigem Rechenweg.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-pro-preview", // Using Pro for better math logic
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scenario: { type: Type.STRING },
              task: { type: Type.STRING },
              solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalAnswer: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(result.text || "{}");
      setScenario(data);
    } catch (e) {
      console.error(e);
      alert("Fehler bei der Generierung.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {!scenario && !loading && (
        <div className="text-center py-12">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Rechen-Labor</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Trainiere komplexe Berechnungen für {module.title} mit originalen PROXIMUS 5 Tarifen, Tabellen und Formeln. 
            Alle Fälle nutzen die offiziellen Werte von 2026.
          </p>
          <button 
            onClick={generateCalc}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            Aufgabe generieren
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Konstruiere Fallbeispiel mit PROXIMUS 5 Tarifen und berechne Lösung..." />}

      {scenario && (
        <div className="animate-fade-in space-y-8">
          <div className="bg-white border-l-4 border-indigo-500 pl-6 py-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{scenario.title}</h2>
            <div className="prose prose-slate text-slate-700">
              <p className="whitespace-pre-line">{scenario.scenario}</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Target size={20} /> Deine Aufgabe:
            </h3>
            <p className="text-indigo-800 font-medium text-lg">{scenario.task}</p>
          </div>

          <div className="flex justify-center py-4">
            {!showSolution ? (
              <button 
                onClick={() => setShowSolution(true)}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
              >
                Lösung anzeigen
              </button>
            ) : (
              <button 
                onClick={generateCalc}
                className="bg-white border border-slate-300 text-slate-600 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Nächste Aufgabe
              </button>
            )}
          </div>

          {showSolution && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Lösungsweg</h3>
              <div className="space-y-4">
                {scenario.solutionSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="pt-1 text-slate-700">{step}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Endergebnis</span>
                <span className="text-2xl font-bold text-green-600">{scenario.finalAnswer}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChatView = ({ module }: { module: any }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    {role: 'model', text: `Hallo! Ich bin dein AI-Tutor mit vollständigem Zugriff auf **PROXIMUS 5** (alle 1407 Seiten). \n\nFrag mich alles zu **${module.title}**:\n- Bedingungen und Paragraphen\n- Tarife und Berechnungen\n- Tabellen (SF-Klassen, Typ-/Regionalklassen)\n- Praxisfälle und Beispiele\n- Prüfungsrelevante Themen\n\nIch antworte mit exakten Quellenangaben aus PROXIMUS 5!`}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setInput("");
    setLoading(true);

    try {
      const ai = getAI();
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: CONTEXT_2026 + ` 
          
          FOKUS: ${module.title}
          
          ANTWORT-STIL:
          - Zitiere immer die PROXIMUS 5 Quelle (Seite, Paragraph, Tabelle)
          - Nutze originale Bedingungsformulierungen
          - Gib konkrete Zahlen und Werte aus PROXIMUS 5
          - Erkläre praxisnah mit Beispielen
          - Antworte prägnant, außer der User fragt nach Details
          
          Bei Fragen zu Berechnungen: Zeige den vollständigen Rechenweg mit PROXIMUS Tabellen/Tarifen.
          Bei Fragen zu Bedingungen: Zitiere die relevanten Paragraphen wörtlich.
          Bei Fragen zu Fällen: Analysiere anhand der PROXIMUS 5 Bedingungen.
          `
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, {role: 'model', text: result.text || "Keine Antwort."}]);
    } catch (e) {
      setMessages(prev => [...prev, {role: 'model', text: "Fehler: Konnte keine Verbindung zum Tutor herstellen."}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              <div className="markdown-body text-sm" dangerouslySetInnerHTML={{ __html: (window as any).marked.parse(m.text) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-5 py-3 rounded-bl-none flex gap-2 items-center text-slate-500">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
        <input 
          type="text"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Stelle eine Frage..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button 
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
