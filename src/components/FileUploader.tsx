import { useCallback, useState, useMemo } from 'react';
import { useDropzone, FileRejection, Accept } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File as FileIcon, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
const MAX_SIZE = 15 * 1024 * 1024; // 15MB
interface FileUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  progress: number;
}
export function FileUploader({ onUpload, isUploading, progress }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      const firstError = fileRejections[0].errors[0];
      if (firstError.code === 'file-too-large') {
        setError(`File is too large. Max size is 15MB.`);
      } else {
        setError(firstError.message);
      }
      setFile(null);
      setPreview(null);
      return;
    }
    if (acceptedFiles.length > 0) {
      const acceptedFile = acceptedFiles[0];
      setFile(acceptedFile);
      if (acceptedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(acceptedFile);
      } else {
        setPreview(null);
      }
      onUpload(acceptedFile);
    }
  }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_SIZE,
    multiple: false,
    /*accept: {
      'image/*': ['.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    } as Accept,
    */
  });
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  const dropzoneContent = useMemo(() => {
    if (isUploading) {
      return (
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="font-semibold">Uploading...</p>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{progress.toFixed(0)}%</p>
        </div>
      );
    }
    if (file) {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4">
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-32 w-auto object-contain rounded-md mb-2" />
          ) : (
            <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium text-foreground truncate max-w-full">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={(e) => { e.stopPropagation(); removeFile(); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return (
      <div className="text-center space-y-2">
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="font-semibold">
          {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground">Max file size 15MB</p>
      </div>
    );
  }, [isUploading, progress, file, preview, isDragActive, removeFile]);
  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex items-center justify-center w-full h-56 rounded-lg border-2 border-dashed border-border bg-muted/40 cursor-pointer transition-all duration-300 ease-in-out',
          isDragActive && 'border-primary bg-primary/10 shadow-glow',
          error && 'border-destructive bg-destructive/10',
          file && !isUploading && 'p-0'
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {dropzoneContent}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
