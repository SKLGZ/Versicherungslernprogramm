import React, { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Search } from 'lucide-react';
import { Chapter } from '../types/pdf';

interface ChapterNavigationProps {
  chapters: Chapter[];
  activeChapter: string | null;
  onChapterSelect: (chapter: Chapter) => void;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters,
  activeChapter,
  onChapterSelect,
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleChapter = (title: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const filteredChapters = chapters.filter((chapter) =>
    chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={18} />
          Inhaltsverzeichnis
        </h3>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Kapitel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chapter List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredChapters.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Keine Kapitel gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredChapters.map((chapter, index) => (
              <div key={index} className="group">
                <button
                  onClick={() => {
                    if (chapter.subChapters && chapter.subChapters.length > 0) {
                      toggleChapter(chapter.title);
                    }
                    onChapterSelect(chapter);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 ${
                    activeChapter === chapter.title ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm line-clamp-2">
                      {chapter.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Seite {chapter.pageStart}
                      {chapter.pageEnd > chapter.pageStart && ` - ${chapter.pageEnd}`}
                    </div>
                  </div>
                  {chapter.subChapters && chapter.subChapters.length > 0 && (
                    <div className="flex-shrink-0 pt-1">
                      {expandedChapters.has(chapter.title) ? (
                        <ChevronDown size={16} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub-chapters */}
                {chapter.subChapters &&
                  chapter.subChapters.length > 0 &&
                  expandedChapters.has(chapter.title) && (
                    <div className="bg-slate-50">
                      {chapter.subChapters.map((subChapter, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => onChapterSelect(subChapter as Chapter)}
                          className="w-full text-left px-8 py-2 hover:bg-slate-100 transition-colors text-sm text-slate-700"
                        >
                          <div className="font-medium line-clamp-1">{subChapter.title}</div>
                          <div className="text-xs text-slate-500">
                            Seite {subChapter.pageStart}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
