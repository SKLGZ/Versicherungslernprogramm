import { useState, useEffect, useCallback } from 'react';
import { PDFContent, BookmarkEntry, NoteEntry, HighlightEntry } from '../types/pdf';
import {
  getAllPDFs,
  savePDF,
  deletePDF,
  getBookmarksByPDF,
  saveBookmark,
  getNotesByPDF,
  saveNote,
  getHighlightsByPDF,
  saveHighlight,
  exportAllData,
  importAllData,
  initDB,
} from '../utils/storage';

export const usePDFContent = () => {
  const [pdfs, setPdfs] = useState<PDFContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load PDFs
  useEffect(() => {
    const loadPDFs = async () => {
      try {
        await initDB();
        const allPDFs = await getAllPDFs();
        setPdfs(allPDFs);
        setError(null);
      } catch (err) {
        console.error('Error loading PDFs:', err);
        setError('Fehler beim Laden der PDFs');
      } finally {
        setLoading(false);
      }
    };

    loadPDFs();
  }, []);

  // Add a new PDF
  const addPDF = useCallback(async (pdf: PDFContent) => {
    try {
      await savePDF(pdf);
      setPdfs((prev) => [...prev, pdf]);
      setError(null);
    } catch (err) {
      console.error('Error adding PDF:', err);
      setError('Fehler beim Speichern des PDFs');
      throw err;
    }
  }, []);

  // Remove a PDF
  const removePDF = useCallback(async (id: string) => {
    try {
      await deletePDF(id);
      setPdfs((prev) => prev.filter((p) => p.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting PDF:', err);
      setError('Fehler beim Löschen des PDFs');
      throw err;
    }
  }, []);

  // Get a specific PDF
  const getPDFById = useCallback(
    (id: string): PDFContent | undefined => {
      return pdfs.find((p) => p.id === id);
    },
    [pdfs]
  );

  // Export all data
  const exportData = useCallback(async (): Promise<string> => {
    try {
      const data = await exportAllData();
      return data;
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Fehler beim Exportieren der Daten');
      throw err;
    }
  }, []);

  // Import data
  const importData = useCallback(async (jsonData: string) => {
    try {
      await importAllData(jsonData);
      const allPDFs = await getAllPDFs();
      setPdfs(allPDFs);
      setError(null);
    } catch (err) {
      console.error('Error importing data:', err);
      setError('Fehler beim Importieren der Daten');
      throw err;
    }
  }, []);

  return {
    pdfs,
    loading,
    error,
    addPDF,
    removePDF,
    getPDFById,
    exportData,
    importData,
  };
};

// Hook for managing bookmarks
export const useBookmarks = (pdfId: string) => {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const data = await getBookmarksByPDF(pdfId);
        setBookmarks(data);
      } catch (err) {
        console.error('Error loading bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [pdfId]);

  const addBookmark = useCallback(async (bookmark: BookmarkEntry) => {
    try {
      await saveBookmark(bookmark);
      setBookmarks((prev) => [...prev, bookmark]);
    } catch (err) {
      console.error('Error adding bookmark:', err);
      throw err;
    }
  }, []);

  return { bookmarks, loading, addBookmark };
};

// Hook for managing notes
export const useNotes = (pdfId: string) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await getNotesByPDF(pdfId);
        setNotes(data);
      } catch (err) {
        console.error('Error loading notes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [pdfId]);

  const addNote = useCallback(async (note: NoteEntry) => {
    try {
      await saveNote(note);
      setNotes((prev) => {
        const existing = prev.find((n) => n.id === note.id);
        if (existing) {
          return prev.map((n) => (n.id === note.id ? note : n));
        }
        return [...prev, note];
      });
    } catch (err) {
      console.error('Error adding note:', err);
      throw err;
    }
  }, []);

  return { notes, loading, addNote };
};

// Hook for managing highlights
export const useHighlights = (pdfId: string) => {
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const data = await getHighlightsByPDF(pdfId);
        setHighlights(data);
      } catch (err) {
        console.error('Error loading highlights:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [pdfId]);

  const addHighlight = useCallback(async (highlight: HighlightEntry) => {
    try {
      await saveHighlight(highlight);
      setHighlights((prev) => [...prev, highlight]);
    } catch (err) {
      console.error('Error adding highlight:', err);
      throw err;
    }
  }, []);

  return { highlights, loading, addHighlight };
};
