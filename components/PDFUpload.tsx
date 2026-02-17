import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';
import { parsePDF } from '../utils/pdfParser';
import { PDFContent } from '../types/pdf';

interface PDFUploadProps {
  onUploadComplete: (pdf: PDFContent) => void;
  onError?: (error: string) => void;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({ onUploadComplete, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('lehrmaterial');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      onError?.('Bitte nur PDF-Dateien hochladen');
      return;
    }

    await processFile(pdfFiles[0]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      onError?.('Bitte nur PDF-Dateien hochladen');
      return;
    }

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const pdfContent = await parsePDF(file, selectedCategory);
      
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onUploadComplete(pdfContent);
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
    } catch (err) {
      console.error('Error processing PDF:', err);
      onError?.('Fehler beim Verarbeiten der PDF-Datei');
      setUploading(false);
      setProgress(0);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Kategorie wählen
        </label>
        <div className="flex flex-wrap gap-2">
          {['lehrmaterial', 'rechnung', 'zertifikat', 'sonstiges'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center">
          {uploading ? (
            <>
              <Loader className="w-16 h-16 text-blue-600 mb-4 animate-spin" />
              <p className="text-lg font-semibold text-slate-900 mb-2">
                PDF wird verarbeitet...
              </p>
              <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">{progress}%</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                PDF hier ablegen oder hochladen
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Ziehe deine PDF-Dateien hierher oder klicke auf den Button, um sie auszuwählen.
                Unterstützt werden alle PDF-Dokumente.
              </p>
              <button
                onClick={openFilePicker}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FileText size={20} />
                Datei auswählen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <CheckCircle size={18} />
          Was passiert beim Upload?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Text wird automatisch extrahiert</li>
          <li>✓ Kapitel werden erkannt und strukturiert</li>
          <li>✓ Volltext-Suche wird aktiviert</li>
          <li>✓ Offline-Verfügbarkeit wird eingerichtet</li>
          <li>✓ KI-Analyse für bessere Lerninhalte</li>
        </ul>
      </div>
    </div>
  );
};
