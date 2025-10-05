import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useAppStore } from '@/stores/useAppStore';
import { FILE_CONFIG, ERROR_MESSAGES } from '@/lib/constants';
import { validateFileType, validateFileSize, generateId, createImagePreview } from '@/utils';
import toast from 'react-hot-toast';

export function useFileUpload() {
  const { setUploadedFile } = useAppStore();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e) => e.code === 'file-too-large')) {
        toast.error(ERROR_MESSAGES.FILE_TOO_LARGE);
      } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
        toast.error(ERROR_MESSAGES.INVALID_FILE_TYPE);
      } else {
        toast.error(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
      return;
    }

    // 处理接受的文件
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // 双重验证
      if (!validateFileType(file, FILE_CONFIG.ALLOWED_TYPES)) {
        toast.error(ERROR_MESSAGES.INVALID_FILE_TYPE);
        return;
      }

      if (!validateFileSize(file, FILE_CONFIG.MAX_SIZE)) {
        toast.error(ERROR_MESSAGES.FILE_TOO_LARGE);
        return;
      }

      try {
        const preview = createImagePreview(file);
        const uploadedFile = {
          file,
          preview,
          id: generateId(),
        };

        setUploadedFile(uploadedFile);
        toast.success('图片上传成功！');
      } catch (error) {
        console.error('File upload error:', error);
        toast.error(ERROR_MESSAGES.UPLOAD_FAILED);
      }
    }
  }, [setUploadedFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: FILE_CONFIG.MAX_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    toast.success('已移除图片');
  }, [setUploadedFile]);

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    removeFile,
  };
}