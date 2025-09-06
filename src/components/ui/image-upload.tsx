import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle,
  FileImage
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  existingImagesCount?: number; // Count of existing images (not new uploads)
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 999,
  maxSize = 5,
  className,
  disabled = false,
  existingImagesCount = 0
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // Validate file size
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Arquivo(s) muito grande(s). Tamanho máximo: ${maxSize}MB`);
      return;
    }

    // Validate total count (including existing images)
    const totalFiles = existingImagesCount + images.length + acceptedFiles.length;
    if (totalFiles > maxImages) {
      setError(`Máximo de ${maxImages} imagens permitidas (${existingImagesCount} existente(s) + ${images.length + acceptedFiles.length} nova(s))`);
      return;
    }

    // Validate file types
    const invalidFiles = acceptedFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Apenas arquivos de imagem são permitidos');
      return;
    }

    // Create previews
    const newImages = [...images, ...acceptedFiles];
    const newPreviews = [...previews];
    
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    onImagesChange(newImages);
  }, [images, onImagesChange, maxImages, maxSize, previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    disabled: disabled || (existingImagesCount + images.length) >= maxImages
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setPreviews(newPreviews);
    setError(null);
  };

  const canAddMore = (existingImagesCount + images.length) < maxImages && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">
                {isDragActive ? 'Solte as imagens aqui' : 'Adicionar Imagens'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Arraste imagens ou clique para selecionar
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Tamanho: até {maxSize}MB cada</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Novas Imagens ({images.length})
            </h4>
            {images.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {(images.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(1)}MB
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((file, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <CardContent className="p-2">
                  <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                    {previews[index] ? (
                      <img
                        src={previews[index]}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* File Info */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="truncate">{file.name}</p>
                    <p>{(file.size / (1024 * 1024)).toFixed(1)}MB</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !canAddMore && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma imagem selecionada</p>
        </div>
      )}
    </div>
  );
};