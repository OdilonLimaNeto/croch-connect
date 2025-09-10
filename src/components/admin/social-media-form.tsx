import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Globe } from 'lucide-react';
import { SocialMedia } from '@/types';

interface SocialMediaFormProps {
  socialMedia: SocialMedia[];
  onChange: (socialMedia: SocialMedia[]) => void;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'tiktok', label: 'TikTok', icon: Globe },
  { value: 'website', label: 'Site', icon: Globe },
];

export const SocialMediaForm: React.FC<SocialMediaFormProps> = ({
  socialMedia,
  onChange,
}) => {
  const [newSocial, setNewSocial] = useState<Partial<SocialMedia>>({
    platform: '',
    url: '',
    icon: ''
  });

  const addSocialMedia = () => {
    if (!newSocial.platform || !newSocial.url) return;

    const platform = SOCIAL_PLATFORMS.find(p => p.value === newSocial.platform);
    if (!platform) return;

    const socialMediaEntry: SocialMedia = {
      platform: platform.label,
      url: newSocial.url,
      icon: newSocial.platform
    };

    onChange([...socialMedia, socialMediaEntry]);
    setNewSocial({ platform: '', url: '', icon: '' });
  };

  const removeSocialMedia = (index: number) => {
    onChange(socialMedia.filter((_, i) => i !== index));
  };

  const updateSocialMedia = (index: number, field: keyof SocialMedia, value: string) => {
    const updated = [...socialMedia];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const renderIcon = (iconKey: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === iconKey);
    if (!platform) return <Globe className="w-4 h-4" />;
    const IconComponent = platform.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de redes sociais existentes */}
        {socialMedia.length > 0 && (
          <div className="space-y-3">
            <Label>Redes Sociais Cadastradas</Label>
            {socialMedia.map((social, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="gap-2">
                  {renderIcon(social.icon)}
                  {social.platform}
                </Badge>
                <Input
                  value={social.url}
                  onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                  placeholder="URL da rede social"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSocialMedia(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulário para adicionar nova rede social */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Adicionar Nova Rede Social</Label>
          <div className="flex gap-3">
            <Select
              value={newSocial.platform || ''}
              onValueChange={(value) => setNewSocial({ ...newSocial, platform: value, icon: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="URL da rede social"
              value={newSocial.url || ''}
              onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
              className="flex-1"
            />
            
            <Button
              type="button"
              onClick={addSocialMedia}
              disabled={!newSocial.platform || !newSocial.url}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};