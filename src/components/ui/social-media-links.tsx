import React, { useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaTiktok, FaGlobe } from 'react-icons/fa';
import { SiteSettings, SocialMedia } from '@/types';
import { SiteSettingsService } from '@/services/siteSettingsService';

interface SocialMediaLinksProps {
  className?: string;
  variant?: 'compact' | 'showcase';
}

const SOCIAL_ICONS = {
  facebook: { 
    icon: FaFacebook, 
    color: '#1877F2',
    name: 'Facebook'
  },
  instagram: { 
    icon: FaInstagram, 
    color: '#E4405F',
    name: 'Instagram'
  },
  twitter: { 
    icon: FaTwitter, 
    color: '#1DA1F2',
    name: 'Twitter'
  },
  linkedin: { 
    icon: FaLinkedin, 
    color: '#0A66C2',
    name: 'LinkedIn'
  },
  youtube: { 
    icon: FaYoutube, 
    color: '#FF0000',
    name: 'YouTube'
  },
  whatsapp: { 
    icon: FaWhatsapp, 
    color: '#25D366',
    name: 'WhatsApp'
  },
  tiktok: { 
    icon: FaTiktok, 
    color: '#000000',
    name: 'TikTok'
  },
  website: { 
    icon: FaGlobe, 
    color: '#6366F1',
    name: 'Website'
  },
};

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({ className = "", variant = 'compact' }) => {
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

  const getSocialConfig = (iconKey: string) => {
    return SOCIAL_ICONS[iconKey as keyof typeof SOCIAL_ICONS] || SOCIAL_ICONS.website;
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

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground mr-3">
            Siga-nos:
          </span>
          <div className="flex gap-2">
            {siteSettings.social_media.map((social, index) => {
              const config = getSocialConfig(social.icon);
              const IconComponent = config.icon;
              
              return (
                <button
                  key={index}
                  onClick={() => handleSocialClick(social)}
                  className="
                    group relative p-2 rounded-lg
                    bg-card/50 dark:bg-card/30 
                    border border-border/50 dark:border-border/30
                    hover:border-primary/30 dark:hover:border-primary/40
                    hover:bg-card dark:hover:bg-card/50
                    transition-all duration-200 ease-out
                    hover:scale-105
                  "
                  title={`Seguir no ${social.platform}`}
                >
                  <IconComponent 
                    className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" 
                    style={{ color: config.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Showcase variant - more detailed view
  return (
    <div className={`w-full ${className}`}>
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-primary mb-3">Conecte-se Conosco</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Acompanhe nossos trabalhos nas redes sociais
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 max-w-lg mx-auto">
        {siteSettings.social_media.map((social, index) => {
          const config = getSocialConfig(social.icon);
          const IconComponent = config.icon;
          
          return (
            <div
              key={index}
              onClick={() => handleSocialClick(social)}
              className="group cursor-pointer"
            >
              <div className="
                relative p-3 rounded-xl 
                bg-card dark:bg-card 
                border border-border dark:border-border
                hover:border-primary/30 dark:hover:border-primary/40
                transition-all duration-300 ease-out
                hover:shadow-soft dark:hover:shadow-lg
                hover:scale-105
                hover:-translate-y-1
              ">
                <div className="
                  relative w-12 h-12 flex items-center justify-center
                  rounded-lg overflow-hidden
                  bg-background/50 dark:bg-background/30
                  group-hover:bg-background/80 dark:group-hover:bg-background/50
                  transition-all duration-300
                ">
                  <IconComponent 
                    className="w-6 h-6 transition-all duration-300 group-hover:scale-110" 
                    style={{ color: config.color }}
                  />
                </div>
                
                {/* Tooltip/Label */}
                <div className="
                  absolute -bottom-8 left-1/2 transform -translate-x-1/2
                  px-2 py-1 rounded-md
                  bg-foreground/90 dark:bg-foreground/80
                  text-background dark:text-background
                  text-xs font-medium
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  pointer-events-none
                  whitespace-nowrap
                  z-10
                ">
                  {social.platform}
                  <div className="
                    absolute -top-1 left-1/2 transform -translate-x-1/2
                    w-2 h-2 rotate-45
                    bg-foreground/90 dark:bg-foreground/80
                  "></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};