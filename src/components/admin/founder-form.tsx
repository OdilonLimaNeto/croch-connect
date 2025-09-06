import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { X, Plus } from 'lucide-react';
import { FounderFormData, Founder } from '@/types';

interface FounderFormProps {
  founder?: Founder;
  onSubmit: (data: FounderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FounderForm: React.FC<FounderFormProps> = ({
  founder,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FounderFormData>({
    name: '',
    role: '',
    description: '',
    expertise: [],
    display_order: 0,
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    if (founder) {
      setFormData({
        name: founder.name,
        role: founder.role,
        description: founder.description || '',
        expertise: founder.expertise || [],
        display_order: founder.display_order,
      });
    }
  }, [founder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      image: images[0],
    });
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExpertise();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {founder ? 'Editar Fundadora' : 'Nova Fundadora'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Ordem de Exibição</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                display_order: parseInt(e.target.value) || 0 
              }))}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Áreas de Expertise</Label>
            <div className="flex gap-2">
              <Input
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma área de expertise"
              />
              <Button
                type="button"
                onClick={addExpertise}
                size="icon"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.expertise.map((exp, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeExpertise(exp)}
                >
                  {exp}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto da Fundadora</Label>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={1}
              maxSize={5}
            />
            {founder?.image_url && images.length === 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Imagem atual:</p>
                <img
                  src={founder.image_url}
                  alt={founder.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : founder ? 'Atualizar' : 'Criar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};