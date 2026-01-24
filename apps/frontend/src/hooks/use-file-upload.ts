'use client';

import { useState } from 'react';
import { optimizeImageFile, readImageInfo, ImageInfo } from '../lib/image-utils';
import { getTenantKeyFromLocation } from '@/lib/tenant-utils';

interface UploadedFile {
  file: File;
  url: string;
  uploading: boolean;
  error?: string;
  imageInfo?: ImageInfo;
  originalName?: string;
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

    // Para imágenes, permitimos un tamaño mayor de entrada (cámara), porque se optimizan antes de subir.
    // Igual ponemos un límite duro para evitar archivos excesivos.
    const hardLimitForImages = 20 * 1024 * 1024; // 20MB
    if (file.type.startsWith('image/')) {
      if (file.size > hardLimitForImages) {
        return `La imagen es muy grande. Máximo 20MB permitido antes de optimizar.`;
      }
    } else {
      if (file.size > maxSizeInBytes) {
        return `El archivo es muy grande. Máximo ${maxSizeInMB}MB permitido.`;
      }
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
    // Upload file to local provider via API route
    const tenantId = getTenantKeyFromLocation();
    const response = await fetch(
      `/api/upload?filename=${encodeURIComponent(file.name)}&tenantId=${encodeURIComponent(
        tenantId
      )}`,
      {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
        },
        body: file,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al subir archivo');
    }

    const blob = await response.json();
    return blob.url;
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

    // Add files with uploading state (optimizando imágenes para mejor rendimiento)
    const newUploadedFiles: UploadedFile[] = [];
    for (const originalFile of fileArray) {
      const imageInfo = originalFile.type.startsWith('image/')
        ? await readImageInfo(originalFile).catch(() => undefined)
        : undefined;

      const processedFile = originalFile.type.startsWith('image/')
        ? await optimizeImageFile(originalFile, { maxDimension: 1600, quality: 0.82, preferWebp: true })
        : originalFile;

      // Luego de optimizar, aplicamos el máximo real configurado (p.ej. 5MB)
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (processedFile.size > maxSizeInBytes) {
        throw new Error(`La imagen optimizada supera el máximo permitido (${maxSizeInMB}MB). Prueba con otra imagen o reduce su tamaño.`);
      }

      newUploadedFiles.push({
        file: processedFile,
        originalName: originalFile.name,
        imageInfo,
        url: '',
        uploading: true,
      });
    }

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
