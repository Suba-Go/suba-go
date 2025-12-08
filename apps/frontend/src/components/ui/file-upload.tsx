'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useFileUpload } from '@/hooks/use-file-upload';

interface FileUploadProps {
  onFilesChange: (urls: string[]) => void;
  onUploadStatusChange?: (isUploading: boolean) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizeInMB?: number;
  label?: string;
  description?: string;
  className?: string;
}

export function FileUpload({
  onFilesChange,
  onUploadStatusChange,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxFiles = 10,
  maxSizeInMB = 10,
  label = 'Subir archivos',
  description = 'Arrastra archivos aquí o haz clic para seleccionar',
  className = '',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { files, isUploading, hasErrors, allUploaded, addFiles, removeFile } =
    useFileUpload({
      maxFiles,
      maxSizeInMB,
      acceptedTypes,
    });

  // Notify parent about upload status
  React.useEffect(() => {
    onUploadStatusChange?.(isUploading);
  }, [isUploading, onUploadStatusChange]);

  // Keep a stable reference to the callback to avoid effect loops
  const onFilesChangeRef = React.useRef(onFilesChange);
  React.useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  // Update parent component when uploads complete
  React.useEffect(() => {
    if (allUploaded) {
      const urls = files
        .filter((f) => !f.uploading && !f.error && f.url)
        .map((f) => f.url);
      onFilesChangeRef.current(urls);
    }
  }, [allUploaded, files]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        await addFiles(e.dataTransfer.files);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al subir archivos'
        );
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      try {
        await addFiles(e.target.files);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al subir archivos'
        );
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }
            ${error ? 'border-red-500 bg-red-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">{description}</p>
          <p className="text-xs text-gray-500">
            Máximo {maxFiles} archivos, {maxSizeInMB}MB cada uno
          </p>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
          
          {/* Grid layout for images */}
          {acceptedTypes.some(t => t.includes('image')) && files.some(f => f.file.type.startsWith('image/')) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {files
                .filter(f => f.file.type.startsWith('image/'))
                .map((uploadedFile, index) => {
                  const previewUrl = uploadedFile.url || URL.createObjectURL(uploadedFile.file);
                  return (
                    <div key={index} className="relative group">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                        <img
                          src={previewUrl}
                          alt={uploadedFile.file.name}
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            if (!uploadedFile.url) URL.revokeObjectURL(previewUrl);
                          }}
                        />
                        {uploadedFile.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                             <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                        {uploadedFile.error && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center border-2 border-red-500">
                             <span className="text-white bg-red-500 px-2 py-1 text-xs rounded">Error</span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(uploadedFile.file);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-gray-500 mt-1 truncate" title={uploadedFile.file.name}>
                        {uploadedFile.file.name}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}

          {/* List layout for non-image files */}
          <div className="space-y-2">
            {files
              .filter(f => !f.file.type.startsWith('image/'))
              .map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploadedFile.uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {uploadedFile.error && (
                    <span className="text-xs text-red-500">Error</span>
                  )}
                  {!uploadedFile.uploading && !uploadedFile.error && (
                    <span className="text-xs text-green-500">✓</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.file);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {isUploading && (
            <p className="text-sm text-blue-600">Subiendo archivos...</p>
          )}
          {hasErrors && (
            <p className="text-sm text-red-600">
              Algunos archivos no se pudieron subir
            </p>
          )}
        </div>
      )}
    </div>
  );
}
