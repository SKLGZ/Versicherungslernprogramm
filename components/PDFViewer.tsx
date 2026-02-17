import React, { useState } from 'react';
import { BookOpen, Bookmark, MessageSquare, Highlighter, ZoomIn, ZoomOut, ChevronLeft } from 'lucide-react';
import { PDFContent, Chapter, NoteEntry } from '../types/pdf';
import { ChapterNavigation } from './ChapterNavigation';
import { useNotes, useBookmarks, useHighlights } from '../hooks/usePDFContent';

interface PDFViewerProps {
  pdf: PDFContent;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdf, onClose }) => {
  const [activeChapter, setActiveChapter] = useState<Chapter>(pdf.chapters[0]);
  const [fontSize, setFontSize] = useState(16);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { notes, addNote } = useNotes(pdf.id);
  const { bookmarks, addBookmark } = useBookmarks(pdf.id);
  const { highlights, addHighlight } = useHighlights(pdf.id);

  const handleChapterSelect = (chapter: Chapter) => {
    setActiveChapter(chapter);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note: NoteEntry = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      pdfId: pdf.id,
      chapterTitle: activeChapter.title,
      content: newNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addNote(note);
    setNewNote('');
  };

  const handleAddBookmark = async () => {
    await addBookmark({
      pdfId: pdf.id,
      chapterTitle: activeChapter.title,
      pageNumber: activeChapter.pageStart,
      createdAt: new Date(),
    });
  };

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12));

  const chapterNotes = notes.filter((n) => n.chapterTitle === activeChapter.title);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50">
      {/* Sidebar - Navigation */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-3"
          >
            <ChevronLeft size={20} />
            Zurück zur Bibliothek
          </button>
          <h2 className="font-bold text-slate-900 text-lg line-clamp-2">{pdf.fileName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {pdf.totalPages} Seiten • {pdf.chapters.length} Kapitel
          </p>
        </div>
        <ChapterNavigation
          chapters={pdf.chapters}
          activeChapter={activeChapter.title}
          onChapterSelect={handleChapterSelect}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseFontSize}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Schrift verkleinern"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-[60px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={increaseFontSize}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Schrift vergrößern"
            >
              <ZoomIn size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddBookmark}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Bookmark size={18} />
              <span className="hidden sm:inline">Lesezeichen</span>
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showNotes
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MessageSquare size={18} />
              <span className="hidden sm:inline">Notizen ({chapterNotes.length})</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            {/* Chapter Header */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <h1
                className="text-3xl font-bold text-slate-900 mb-2"
                style={{ fontSize: `${fontSize + 8}px` }}
              >
                {activeChapter.title}
              </h1>
              <p className="text-slate-500">
                Seite {activeChapter.pageStart}
                {activeChapter.pageEnd > activeChapter.pageStart &&
                  ` - ${activeChapter.pageEnd}`}
              </p>
            </div>

            {/* Chapter Content */}
            <div
              className="prose prose-slate max-w-none"
              style={{ fontSize: `${fontSize}px` }}
            >
              <div className="whitespace-pre-line leading-relaxed text-slate-700">
                {activeChapter.content}
              </div>
            </div>

            {/* Notes Section */}
            {showNotes && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} />
                  Notizen zu diesem Kapitel
                </h3>

                {/* Add Note */}
                <div className="mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Notiz hinzufügen..."
                    className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Notiz speichern
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {chapterNotes.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Noch keine Notizen zu diesem Kapitel
                    </p>
                  ) : (
                    chapterNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                      >
                        <p className="text-slate-700">{note.content}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(note.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
