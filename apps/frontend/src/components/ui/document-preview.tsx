'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { ScrollArea } from '@suba-go/shared-components/components/ui/scroll-area';

interface DocumentPreviewProps {
  url: string;
  filename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({
  url,
  filename,
  open,
  onOpenChange,
}: DocumentPreviewProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isFileTooLarge, setIsFileTooLarge] = useState(false);
  const [bytesLoaded, setBytesLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);

  const isTextFile = (type: string | null) => {
    if (!type) return false;
    return (
      type.includes('text') ||
      type.includes('json') ||
      type.includes('xml') ||
      type.includes('html') ||
      type.includes('csv')
    );
  };

  const isPDF = (type: string | null, name: string) => {
    return type?.includes('pdf') || name.toLowerCase().endsWith('.pdf');
  };

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setPreviewContent(null);
      setIsLoadingPreview(false);
      setIsFileTooLarge(false);
      setBytesLoaded(0);
      setError(null);
      setContentType(null);
      return;
    }

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setError(null);

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Error al cargar el documento');
        }

        const type = response.headers.get('content-type');
        setContentType(type);

        // Check if it's a PDF
        if (isPDF(type, filename)) {
          setPreviewContent('PDF');
          setIsLoadingPreview(false);
          return;
        }

        // Check if it's a text file
        if (!isTextFile(type)) {
          setPreviewContent(null);
          setIsLoadingPreview(false);
          return;
        }

        // Stream the content for text files
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No se pudo leer el archivo');
        }

        const decoder = new TextDecoder();
        let content = '';
        let totalBytes = 0;
        const maxBytes = 1024 * 1024; // 1MB limit

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          totalBytes += value.length;
          setBytesLoaded(totalBytes);

          if (totalBytes > maxBytes) {
            setIsFileTooLarge(true);
            content += '\n\n--- ARCHIVO TRUNCADO (Máximo 1MB) ---';
            break;
          }

          content += decoder.decode(value, { stream: true });
        }

        setPreviewContent(content);
      } catch (err) {
        console.error('Error loading preview:', err);
        setError(
          err instanceof Error ? err.message : 'Error al cargar el documento'
        );
      } finally {
        setIsLoadingPreview(false);
      }
    };

    loadPreview();
  }, [open, url, filename]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] min-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {filename}
          </DialogTitle>
          <DialogDescription>
            {isLoadingPreview && `Cargando... ${formatBytes(bytesLoaded)}`}
            {isFileTooLarge && 'Archivo truncado (máximo 1MB)'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoadingPreview && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar Archivo
              </Button>
            </div>
          )}

          {!isLoadingPreview && !error && previewContent === 'PDF' && (
            <div className="h-full w-full overflow-auto min-h-[60vh] itmes-center justify-center">
              <ScrollArea>
                <iframe
                  src={url}
                  className="w-full h-full border-0 rounded-lg"
                  title={filename}
                />
              </ScrollArea>
            </div>
          )}

          {!isLoadingPreview &&
            !error &&
            previewContent &&
            previewContent !== 'PDF' && (
              <div className="h-full border rounded-lg overflow-auto min-h-[60vh] items-center justify-center">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                  {previewContent}
                </pre>
              </div>
            )}

          {!isLoadingPreview && !error && !previewContent && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Vista previa no disponible para este tipo de archivo
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {contentType || 'Tipo de archivo desconocido'}
              </p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Descargar Archivo
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
