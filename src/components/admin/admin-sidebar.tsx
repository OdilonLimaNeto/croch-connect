import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SiteSettingsService } from '@/services/siteSettingsService';
import { SiteSettings } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  Tag,
  Palette,
  ShoppingBag,
  LogOut,
  User,
  Home,
  Users,
  Settings
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Produtos',
    url: '/admin/produtos',
    icon: Package,
  },
  {
    title: 'Promoções',
    url: '/admin/promocoes',
    icon: Tag,
  },
  {
    title: 'Materiais',
    url: '/admin/materiais',
    icon: Palette,
  },
  {
    title: 'Sobre a Empresa',
    url: '/admin/empresa',
    icon: User,
  },
  {
    title: 'Usuários',
    url: '/admin/usuarios',
    icon: Users,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    const fetchSiteSettings = async () => {
      const settings = await SiteSettingsService.getSiteSettings();
      setSiteSettings(settings);
    };

    fetchSiteSettings();

    // Listen for site settings updates
    const handleSiteSettingsUpdate = () => {
      fetchSiteSettings();
    };

    window.addEventListener('siteSettingsUpdated', handleSiteSettingsUpdate);

    return () => {
      window.removeEventListener('siteSettingsUpdated', handleSiteSettingsUpdate);
    };
  }, []);

  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          {siteSettings?.logo_url ? (
            <img 
              src={siteSettings.logo_url} 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">
                {siteSettings?.site_name || 'Nó de Duas'}
              </h2>
              <p className="text-xs text-sidebar-foreground/60">
                Admin Panel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trigger */}
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Acesso Rápido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="hover:bg-sidebar-accent/50">
                    <Home className="mr-2 h-4 w-4" />
                    {!isCollapsed && <span>Ver Site</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        {/* User Info */}
        {user && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sidebar-foreground font-medium truncate">
                    {user.profile?.full_name || user.email}
                  </p>
                  <p className="text-sidebar-foreground/60 text-xs">
                    {user.profile?.role || 'admin'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </Sidebar>
  );
}