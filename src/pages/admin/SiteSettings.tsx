import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { SiteSettingsForm } from '@/components/admin/site-settings-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import { SiteSettingsService } from '@/services/siteSettingsService';
import { SiteSettings, SiteSettingsFormData } from '@/types';

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await SiteSettingsService.getSiteSettings();
      setSettings(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (data: SiteSettingsFormData) => {
    if (!settings) return;

    try {
      setFormLoading(true);
      const result = await SiteSettingsService.updateSiteSettings(settings.id, data);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Configurações atualizadas com sucesso',
        });
        loadSettings();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao atualizar configurações',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar configurações',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form or navigate away if needed
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações do Site</h1>
            <p className="text-muted-foreground">
              Gerencie a aparência e configurações básicas do site
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <SiteSettingsForm
            settings={settings || undefined}
            onSubmit={handleUpdateSettings}
            onCancel={handleCancel}
            isLoading={formLoading}
          />
        </div>
      </div>
    </AdminLayout>
  );
}