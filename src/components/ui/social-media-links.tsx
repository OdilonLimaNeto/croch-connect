import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteSettings, SocialMedia } from '@/types';
import { SiteSettingsService } from '@/services/siteSettingsService';

interface SocialMediaLinksProps {
  className?: string;
}

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  whatsapp: MessageCircle,
  tiktok: Globe,
  website: Globe,
};

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({ className = "" }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const settings = await SiteSettingsService.getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error('Error loading site settings:', error);
      }
    };

    loadSiteSettings();

    // Listen for site settings updates
    const handleSiteSettingsUpdate = () => {
      loadSiteSettings();
    };

    window.addEventListener('siteSettingsUpdated', handleSiteSettingsUpdate);
    return () => window.removeEventListener('siteSettingsUpdated', handleSiteSettingsUpdate);
  }, []);

  const getSocialIcon = (iconKey: string) => {
    return SOCIAL_ICONS[iconKey as keyof typeof SOCIAL_ICONS] || Globe;
  };

  const handleSocialClick = (social: SocialMedia) => {
    // For WhatsApp, format the URL properly
    if (social.icon === 'whatsapp') {
      // Assuming the URL is a phone number, format it for WhatsApp
      const phoneNumber = social.url.replace(/\D/g, ''); // Remove non-digits
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    } else {
      // For other social media, open the URL directly
      let url = social.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      window.open(url, '_blank');
    }
  };

  if (!siteSettings?.social_media || siteSettings.social_media.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-foreground">Siga-nos:</span>
      <div className="flex gap-2">
        {siteSettings.social_media.map((social, index) => {
          const IconComponent = getSocialIcon(social.icon);
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => handleSocialClick(social)}
              className="w-9 h-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
              title={`Seguir no ${social.platform}`}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};