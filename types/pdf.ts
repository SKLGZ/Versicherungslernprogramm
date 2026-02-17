export interface SubChapter {
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
}

export interface Chapter {
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  subChapters?: SubChapter[];
}

export interface PDFContent {
  id: string;
  fileName: string;
  uploadDate: Date;
  totalPages: number;
  chapters: Chapter[];
  fullText: string;
  category?: 'lehrmaterial' | 'rechnung' | 'zertifikat' | 'sonstiges';
}

export interface PDFMetadata {
  id: string;
  fileName: string;
  uploadDate: Date;
  totalPages: number;
  category: string;
  fileSize: number;
}

export interface BookmarkEntry {
  pdfId: string;
  chapterTitle: string;
  pageNumber: number;
  note?: string;
  createdAt: Date;
}

export interface NoteEntry {
  id: string;
  pdfId: string;
  chapterTitle: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HighlightEntry {
  id: string;
  pdfId: string;
  chapterTitle: string;
  text: string;
  pageNumber: number;
  createdAt: Date;
}
