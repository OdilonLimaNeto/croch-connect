import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SiteSettingsService } from '@/services/siteSettingsService';
import { SiteSettings } from '@/types';

const Header = () => {
  const location = useLocation();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const loadSiteSettings = async () => {
      const settings = await SiteSettingsService.getSiteSettings();
      setSiteSettings(settings);
    };
    loadSiteSettings();
    
    // Listen for storage events or custom events when settings change
    const handleSettingsUpdate = () => {
      loadSiteSettings();
    };
    
    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          {siteSettings?.logo_url ? (
            <img
              src={siteSettings.logo_url}
              alt={siteSettings.site_name}
              className="h-8 object-contain"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <span className="text-xl font-semibold text-primary">
            {siteSettings?.site_name || 'Nó de Duas'}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={cn(
              "text-foreground/80 hover:text-foreground transition-colors",
              isActive('/') && "text-foreground font-medium"
            )}
          >
            Início
          </Link>
          <Link
            to="/produtos"
            className={cn(
              "text-foreground/80 hover:text-foreground transition-colors",
              isActive('/produtos') && "text-foreground font-medium"
            )}
          >
            Produtos
          </Link>
        </nav>

        {/* Theme Toggle & Admin Access */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/admin/login">
            <Button variant="outline" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;