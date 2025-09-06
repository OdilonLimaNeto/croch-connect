import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { SiteSettingsFormData, SiteSettings } from '@/types';

interface SiteSettingsFormProps {
  settings?: SiteSettings;
  onSubmit: (data: SiteSettingsFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SiteSettingsForm: React.FC<SiteSettingsFormProps> = ({
  settings,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SiteSettingsFormData>({
    site_name: 'Nó de Duas',
    primary_color: '#000000',
  });
  
  const [logoImages, setLogoImages] = useState<File[]>([]);
  const [faviconImages, setFaviconImages] = useState<File[]>([]);

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name,
        primary_color: settings.primary_color,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      logo: logoImages[0],
      favicon: faviconImages[0],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site_name">Nome do Site</Label>
            <Input
              id="site_name"
              value={formData.site_name}
              onChange={(e) => setFormData(prev => ({ ...prev, site_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Cor Principal</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo do Site</Label>
            <ImageUpload
              images={logoImages}
              onImagesChange={setLogoImages}
              maxImages={1}
              maxSize={5}
            />
            {settings?.logo_url && logoImages.length === 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Logo atual:</p>
                <img
                  src={settings.logo_url}
                  alt="Logo atual"
                  className="h-12 object-contain"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Favicon</Label>
            <ImageUpload
              images={faviconImages}
              onImagesChange={setFaviconImages}
              maxImages={1}
              maxSize={2}
            />
            {settings?.favicon_url && faviconImages.length === 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Favicon atual:</p>
                <img
                  src={settings.favicon_url}
                  alt="Favicon atual"
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
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