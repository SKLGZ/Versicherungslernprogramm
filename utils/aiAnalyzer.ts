import { GoogleGenAI, Type } from "@google/genai";
import { PDFContent, Chapter } from "../types/pdf";

const CONTEXT_2026 = `
HEUTE: 15. Mai 2026.
WICHTIG: Du bist ein strenger aber fairer IHK-Prüfungstutor für den §34d GewO (Versicherungsfachmann).
Nutze ausschließlich Daten und Fakten, die für 2026 relevant sind (z.B. erhöhte BBG in der GRV/GKV).
Referenzmaterial: "Proximus" Fachbuch Stil - strukturiert, praxisnah, prüfungsrelevant.
Deine Persönlichkeit: Professionell, motivierend, präzise (wie Sachkundeguru, aber mit tieferer Analyse).
`;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generate a summary of a chapter using AI
 */
export const generateChapterSummary = async (chapter: Chapter): Promise<string> => {
  const ai = getAI();
  const prompt = `
    ${CONTEXT_2026}
    
    KAPITEL: ${chapter.title}
    INHALT: ${chapter.content.substring(0, 3000)}
    
    AUFGABE: Erstelle eine prägnante Zusammenfassung dieses Kapitels im Proximus-Stil.
    - Hebe die wichtigsten Konzepte hervor
    - Verwende klare Strukturierung
    - Betone prüfungsrelevante Inhalte
    FORMAT: Markdown mit Aufzählungen und Fettungen
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return result.text || "Zusammenfassung konnte nicht generiert werden.";
};

/**
 * Generate quiz questions from PDF content
 */
export const generateQuestionsFromPDF = async (
  pdf: PDFContent,
  topic?: string
): Promise<any[]> => {
  const ai = getAI();
  
  // Use relevant chapters or all content
  const relevantContent = topic
    ? pdf.chapters
        .filter((ch) => ch.title.toLowerCase().includes(topic.toLowerCase()))
        .map((ch) => `${ch.title}\n${ch.content.substring(0, 1000)}`)
        .join("\n\n")
    : pdf.chapters
        .slice(0, 5)
        .map((ch) => `${ch.title}\n${ch.content.substring(0, 1000)}`)
        .join("\n\n");

  const prompt = `
    ${CONTEXT_2026}
    
    QUELLE: ${pdf.fileName}
    INHALT:
    ${relevantContent}
    
    AUFGABE: Erstelle 5 anspruchsvolle Multiple-Choice-Fragen basierend auf diesem Inhalt.
    FORMAT: JSON Array.
    STRUKTUR:
    [
      {
        "question": "Fragetext...",
        "options": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
        "correctIndex": 0,
        "explanation": "Erklärung warum A richtig ist und warum B,C,D falsch sind."
      }
    ]
    STIL: IHK-Niveau, fallbasiert wenn möglich, basierend auf dem gegebenen Inhalt.
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
            explanation: { type: Type.STRING },
          },
        },
      },
    },
  });

  return JSON.parse(result.text || "[]");
};

/**
 * Generate calculation exercise from PDF content
 */
export const generateCalculationFromPDF = async (
  pdf: PDFContent,
  topic?: string
): Promise<any> => {
  const ai = getAI();

  const relevantContent = topic
    ? pdf.chapters
        .filter((ch) => ch.title.toLowerCase().includes(topic.toLowerCase()))
        .map((ch) => `${ch.title}\n${ch.content.substring(0, 1000)}`)
        .join("\n\n")
    : pdf.chapters
        .slice(0, 3)
        .map((ch) => `${ch.title}\n${ch.content.substring(0, 1000)}`)
        .join("\n\n");

  const prompt = `
    ${CONTEXT_2026}
    
    QUELLE: ${pdf.fileName}
    INHALT:
    ${relevantContent}
    
    AUFGABE: Erstelle eine komplexe Rechenaufgabe basierend auf dem Inhalt.
    FORMAT: JSON Object.
    {
      "title": "Titel der Aufgabe",
      "scenario": "Situationsbeschreibung mit allen Zahlen",
      "task": "Was soll berechnet werden?",
      "solutionSteps": ["Schritt 1: ...", "Schritt 2..."],
      "finalAnswer": "Das Endergebnis"
    }
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
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
          finalAnswer: { type: Type.STRING },
        },
      },
    },
  });

  return JSON.parse(result.text || "{}");
};

/**
 * Answer questions based on PDF content
 */
export const answerQuestionFromPDF = async (
  pdf: PDFContent,
  question: string
): Promise<string> => {
  const ai = getAI();

  // Find most relevant chapters
  const relevantChapters = pdf.chapters
    .filter((ch) =>
      question
        .toLowerCase()
        .split(" ")
        .some(
          (word) =>
            word.length > 3 &&
            (ch.title.toLowerCase().includes(word) ||
              ch.content.toLowerCase().includes(word))
        )
    )
    .slice(0, 3);

  const context =
    relevantChapters.length > 0
      ? relevantChapters
          .map((ch) => `${ch.title}\n${ch.content.substring(0, 2000)}`)
          .join("\n\n")
      : pdf.chapters
          .slice(0, 3)
          .map((ch) => `${ch.title}\n${ch.content.substring(0, 2000)}`)
          .join("\n\n");

  const prompt = `
    ${CONTEXT_2026}
    
    QUELLE: ${pdf.fileName}
    RELEVANTER INHALT:
    ${context}
    
    FRAGE: ${question}
    
    AUFGABE: Beantworte die Frage präzise basierend auf dem gegebenen Inhalt aus dem PDF.
    Wenn der Inhalt die Antwort nicht direkt enthält, nutze dein Fachwissen, aber weise darauf hin.
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return result.text || "Keine Antwort verfügbar.";
};

/**
 * Identify and improve chapter structure using AI
 */
export const improveChapterStructure = async (
  chapters: Chapter[]
): Promise<Chapter[]> => {
  const ai = getAI();

  const chaptersPreview = chapters.map((ch) => ({
    title: ch.title,
    preview: ch.content.substring(0, 200),
    pageStart: ch.pageStart,
    pageEnd: ch.pageEnd,
  }));

  const prompt = `
    ${CONTEXT_2026}
    
    KAPITEL-STRUKTUR:
    ${JSON.stringify(chaptersPreview, null, 2)}
    
    AUFGABE: Analysiere diese Kapitelstruktur und schlage Verbesserungen vor:
    - Bessere Kapiteltitel wenn nötig
    - Identifiziere Unterkapitel
    - Gruppiere verwandte Themen
    
    FORMAT: JSON Array mit verbesserter Struktur
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    // For now, return original chapters
    // In a production app, you'd parse the AI response and restructure
    return chapters;
  } catch (error) {
    console.error("Error improving chapter structure:", error);
    return chapters;
  }
};
