import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { PDFContent, Chapter } from '../types/pdf';

interface SearchResult {
  chapter: Chapter;
  matches: string[];
  score: number;
}

interface SearchBarProps {
  pdfs: PDFContent[];
  onResultSelect: (pdfId: string, chapter: Chapter) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ pdfs, onResultSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, pdfs]);

  const performSearch = (query: string) => {
    setIsSearching(true);

    // Prepare searchable data
    const searchData: Array<{ pdfId: string; chapter: Chapter }> = [];
    pdfs.forEach((pdf) => {
      pdf.chapters.forEach((chapter) => {
        searchData.push({ pdfId: pdf.id, chapter });
      });
    });

    // Configure Fuse.js
    const fuse = new Fuse(searchData, {
      keys: [
        { name: 'chapter.title', weight: 2 },
        { name: 'chapter.content', weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
    });

    const fuseResults = fuse.search(query);
    
    const formattedResults: SearchResult[] = fuseResults.slice(0, 10).map((result) => ({
      chapter: result.item.chapter,
      matches: result.matches?.map((m) => m.value || '') || [],
      score: result.score || 0,
    }));

    setResults(formattedResults);
    setShowResults(true);
    setIsSearching(false);
  };

  const handleResultClick = (result: SearchResult) => {
    const pdfWithChapter = pdfs.find((pdf) =>
      pdf.chapters.some((ch) => ch.title === result.chapter.title)
    );
    if (pdfWithChapter) {
      onResultSelect(pdfWithChapter.id, result.chapter);
      setSearchTerm('');
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Durchsuche alle PDFs und Kapitel..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm">Suche läuft...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Keine Ergebnisse für "{searchTerm}"</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="font-medium text-slate-900 mb-1">
                    {result.chapter.title}
                  </div>
                  <div className="text-sm text-slate-500 line-clamp-2">
                    {result.chapter.content.substring(0, 150)}...
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>Seite {result.chapter.pageStart}</span>
                    <span>•</span>
                    <span>Relevanz: {Math.round((1 - result.score) * 100)}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};
