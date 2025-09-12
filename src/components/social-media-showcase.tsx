import React, { useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp, FaTiktok, FaGlobe } from 'react-icons/fa';
import { SiteSettings, SocialMedia } from '@/types';
import { SiteSettingsService } from '@/services/siteSettingsService';

interface SocialMediaShowcaseProps {
  className?: string;
}

const SOCIAL_ICONS = {
  facebook: { icon: FaFacebook, color: '#1877F2', bgColor: 'bg-blue-100 hover:bg-blue-200' },
  instagram: { icon: FaInstagram, color: '#E4405F', bgColor: 'bg-pink-100 hover:bg-pink-200' },
  twitter: { icon: FaTwitter, color: '#1DA1F2', bgColor: 'bg-sky-100 hover:bg-sky-200' },
  linkedin: { icon: FaLinkedin, color: '#0A66C2', bgColor: 'bg-blue-100 hover:bg-blue-200' },
  youtube: { icon: FaYoutube, color: '#FF0000', bgColor: 'bg-red-100 hover:bg-red-200' },
  whatsapp: { icon: FaWhatsapp, color: '#25D366', bgColor: 'bg-green-100 hover:bg-green-200' },
  tiktok: { icon: FaTiktok, color: '#000000', bgColor: 'bg-gray-100 hover:bg-gray-200' },
  website: { icon: FaGlobe, color: '#6366F1', bgColor: 'bg-indigo-100 hover:bg-indigo-200' },
};

export const SocialMediaShowcase: React.FC<SocialMediaShowcaseProps> = ({ className = "" }) => {
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

  return (
    <div className={`w-full ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-primary mb-2">Conecte-se Conosco</h3>
        <p className="text-muted-foreground">
          Siga nossas redes sociais para ver nossos trabalhos e novidades
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {siteSettings.social_media.map((social, index) => {
          const config = getSocialConfig(social.icon);
          const IconComponent = config.icon;
          
          return (
            <div
              key={index}
              onClick={() => handleSocialClick(social)}
              className={`
                group cursor-pointer p-6 rounded-2xl transition-all duration-300 
                transform hover:scale-105 hover:shadow-lg 
                ${config.bgColor} border border-transparent hover:border-gray-200
              `}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div 
                  className="p-4 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow duration-300"
                  style={{ backgroundColor: 'white' }}
                >
                  <IconComponent 
                    className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" 
                    style={{ color: config.color }}
                  />
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 capitalize mb-1">
                    {social.platform}
                  </h4>
                  <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                    Seguir no {social.platform}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};