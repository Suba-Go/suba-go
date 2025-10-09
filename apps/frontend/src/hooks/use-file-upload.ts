'use client';

import { useState } from 'react';

interface UploadedFile {
  file: File;
  url: string;
  uploading: boolean;
  error?: string;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFiles = 10,
    maxSizeInMB = 10,
    acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  } = options;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `El archivo es muy grande. Máximo ${maxSizeInMB}MB permitido.`;
    }

    // Check file type
    const isValidType = acceptedTypes.some((type) => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return `Tipo de archivo no permitido. Tipos aceptados: ${acceptedTypes.join(
        ', '
      )}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Simulate file upload - replace with actual upload logic
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock URL - replace with actual upload endpoint
        const mockUrl = `https://example.com/uploads/${Date.now()}_${
          file.name
        }`;
        resolve(mockUrl);
      }, 1000 + Math.random() * 2000);
    });
  };

  const addFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    // Check if adding these files would exceed the limit
    if (files.length + fileArray.length > maxFiles) {
      throw new Error(`Máximo ${maxFiles} archivos permitidos`);
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        throw new Error(error);
      }
    }

    // Add files with uploading state
    const newUploadedFiles: UploadedFile[] = fileArray.map((file) => ({
      file,
      url: '',
      uploading: true,
    }));

    setFiles((prev) => [...prev, ...newUploadedFiles]);
    setIsUploading(true);

    // Upload files one by one
    try {
      for (let i = 0; i < newUploadedFiles.length; i++) {
        const file = newUploadedFiles[i];
        try {
          const url = await uploadFile(file.file);

          setFiles((prev) =>
            prev.map((f) =>
              f.file === file.file ? { ...f, url, uploading: false } : f
            )
          );
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file.file
                ? { ...f, uploading: false, error: 'Error al subir archivo' }
                : f
            )
          );
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const getUploadedUrls = (): string[] => {
    return files
      .filter((f) => !f.uploading && !f.error && f.url)
      .map((f) => f.url);
  };

  const hasErrors = files.some((f) => f.error);
  const allUploaded =
    files.length > 0 && files.every((f) => !f.uploading && !f.error);

  return {
    files,
    isUploading,
    hasErrors,
    allUploaded,
    addFiles,
    removeFile,
    clearFiles,
    getUploadedUrls,
  };
}
