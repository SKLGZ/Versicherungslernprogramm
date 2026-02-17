import * as pdfjsLib from 'pdfjs-dist';
import { PDFContent, Chapter } from '../types/pdf';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

interface ParsedPage {
  pageNumber: number;
  text: string;
}

/**
 * Extracts text from a PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<ParsedPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: ParsedPage[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    pages.push({
      pageNumber: i,
      text: text.trim(),
    });
  }
  
  return pages;
};

/**
 * Identifies chapters from extracted text based on common patterns
 */
export const identifyChapters = (pages: ParsedPage[]): Chapter[] => {
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  
  // Common chapter patterns in German insurance books
  const chapterPatterns = [
    /^Kapitel\s+\d+[:.]/i,
    /^\d+\.\s+[A-ZÄÖÜ]/,
    /^Teil\s+[IVX]+/i,
    /^Abschnitt\s+\d+/i,
    /^§\s*\d+/,
  ];
  
  pages.forEach((page) => {
    const lines = page.text.split(/\n+/);
    
    lines.forEach((line) => {
      line = line.trim();
      
      // Check if this line is a chapter heading
      const isChapterHeading = chapterPatterns.some(pattern => pattern.test(line));
      
      // Also check for lines that are all caps and relatively short (likely headings)
      const isAllCapsHeading = line.length > 5 && line.length < 100 && 
                               line === line.toUpperCase() && 
                               /[A-ZÄÖÜ]/.test(line);
      
      if (isChapterHeading || isAllCapsHeading) {
        // Save previous chapter
        if (currentChapter) {
          currentChapter.pageEnd = page.pageNumber - 1;
          chapters.push(currentChapter);
        }
        
        // Start new chapter
        currentChapter = {
          title: line,
          content: '',
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
        };
      } else if (currentChapter) {
        // Add to current chapter content
        currentChapter.content += line + '\n';
        currentChapter.pageEnd = page.pageNumber;
      }
    });
  });
  
  // Save last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }
  
  // If no chapters were found, create a single chapter with all content
  if (chapters.length === 0) {
    const fullText = pages.map(p => p.text).join('\n');
    chapters.push({
      title: 'Gesamtes Dokument',
      content: fullText,
      pageStart: 1,
      pageEnd: pages.length,
    });
  }
  
  return chapters;
};

/**
 * Main function to parse a PDF file
 */
export const parsePDF = async (file: File, category?: string): Promise<PDFContent> => {
  const pages = await extractTextFromPDF(file);
  const chapters = identifyChapters(pages);
  const fullText = pages.map(p => p.text).join('\n');
  
  const pdfContent: PDFContent = {
    id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    fileName: file.name,
    uploadDate: new Date(),
    totalPages: pages.length,
    chapters,
    fullText,
    category: category as any,
  };
  
  return pdfContent;
};

/**
 * Analyzes PDF content with AI to improve chapter detection
 */
export const analyzeWithAI = async (
  content: string,
  aiAnalyzer: (prompt: string) => Promise<string>
): Promise<string> => {
  const prompt = `
Analysiere den folgenden Text aus einem Versicherungsfachbuch und identifiziere die Hauptthemen und Kapitelstruktur:

${content.substring(0, 5000)}

Gib eine strukturierte Übersicht der Themen und Kapitel zurück.
  `;
  
  return await aiAnalyzer(prompt);
};
