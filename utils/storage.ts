import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PDFContent, BookmarkEntry, NoteEntry, HighlightEntry } from '../types/pdf';

interface PDFDatabase extends DBSchema {
  pdfs: {
    key: string;
    value: PDFContent;
    indexes: { 'by-date': Date; 'by-category': string };
  };
  bookmarks: {
    key: string;
    value: BookmarkEntry;
    indexes: { 'by-pdf': string };
  };
  notes: {
    key: string;
    value: NoteEntry;
    indexes: { 'by-pdf': string };
  };
  highlights: {
    key: string;
    value: HighlightEntry;
    indexes: { 'by-pdf': string };
  };
}

const DB_NAME = 'versicherung-pdf-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PDFDatabase>> | null = null;

export const initDB = async (): Promise<IDBPDatabase<PDFDatabase>> => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB<PDFDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // PDFs store
      if (!db.objectStoreNames.contains('pdfs')) {
        const pdfStore = db.createObjectStore('pdfs', { keyPath: 'id' });
        pdfStore.createIndex('by-date', 'uploadDate');
        pdfStore.createIndex('by-category', 'category');
      }
      
      // Bookmarks store
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
        bookmarkStore.createIndex('by-pdf', 'pdfId');
      }
      
      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('by-pdf', 'pdfId');
      }
      
      // Highlights store
      if (!db.objectStoreNames.contains('highlights')) {
        const highlightsStore = db.createObjectStore('highlights', { keyPath: 'id' });
        highlightsStore.createIndex('by-pdf', 'pdfId');
      }
    },
  });
  
  return dbPromise;
};

// PDF Operations
export const savePDF = async (pdf: PDFContent): Promise<void> => {
  const db = await initDB();
  await db.put('pdfs', pdf);
};

export const getPDF = async (id: string): Promise<PDFContent | undefined> => {
  const db = await initDB();
  return db.get('pdfs', id);
};

export const getAllPDFs = async (): Promise<PDFContent[]> => {
  const db = await initDB();
  return db.getAll('pdfs');
};

export const deletePDF = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('pdfs', id);
  
  // Also delete related bookmarks, notes, and highlights
  const tx = db.transaction(['bookmarks', 'notes', 'highlights'], 'readwrite');
  
  const bookmarks = await tx.objectStore('bookmarks').index('by-pdf').getAll(id);
  for (const bookmark of bookmarks) {
    await tx.objectStore('bookmarks').delete(bookmark.id as any);
  }
  
  const notes = await tx.objectStore('notes').index('by-pdf').getAll(id);
  for (const note of notes) {
    await tx.objectStore('notes').delete(note.id);
  }
  
  const highlights = await tx.objectStore('highlights').index('by-pdf').getAll(id);
  for (const highlight of highlights) {
    await tx.objectStore('highlights').delete(highlight.id);
  }
  
  await tx.done;
};

// Bookmark Operations
export const saveBookmark = async (bookmark: BookmarkEntry): Promise<void> => {
  const db = await initDB();
  await db.add('bookmarks', bookmark);
};

export const getBookmarksByPDF = async (pdfId: string): Promise<BookmarkEntry[]> => {
  const db = await initDB();
  return db.getAllFromIndex('bookmarks', 'by-pdf', pdfId);
};

export const deleteBookmark = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('bookmarks', id as any);
};

// Note Operations
export const saveNote = async (note: NoteEntry): Promise<void> => {
  const db = await initDB();
  await db.put('notes', note);
};

export const getNotesByPDF = async (pdfId: string): Promise<NoteEntry[]> => {
  const db = await initDB();
  return db.getAllFromIndex('notes', 'by-pdf', pdfId);
};

export const deleteNote = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('notes', id);
};

// Highlight Operations
export const saveHighlight = async (highlight: HighlightEntry): Promise<void> => {
  const db = await initDB();
  await db.put('highlights', highlight);
};

export const getHighlightsByPDF = async (pdfId: string): Promise<HighlightEntry[]> => {
  const db = await initDB();
  return db.getAllFromIndex('highlights', 'by-pdf', pdfId);
};

export const deleteHighlight = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('highlights', id);
};

// Export/Import Operations
export const exportAllData = async (): Promise<string> => {
  const db = await initDB();
  const data = {
    pdfs: await db.getAll('pdfs'),
    bookmarks: await db.getAll('bookmarks'),
    notes: await db.getAll('notes'),
    highlights: await db.getAll('highlights'),
    exportDate: new Date(),
  };
  return JSON.stringify(data);
};

export const importAllData = async (jsonData: string): Promise<void> => {
  const data = JSON.parse(jsonData);
  const db = await initDB();
  
  const tx = db.transaction(['pdfs', 'bookmarks', 'notes', 'highlights'], 'readwrite');
  
  for (const pdf of data.pdfs || []) {
    await tx.objectStore('pdfs').put(pdf);
  }
  
  for (const bookmark of data.bookmarks || []) {
    await tx.objectStore('bookmarks').put(bookmark);
  }
  
  for (const note of data.notes || []) {
    await tx.objectStore('notes').put(note);
  }
  
  for (const highlight of data.highlights || []) {
    await tx.objectStore('highlights').put(highlight);
  }
  
  await tx.done;
};
