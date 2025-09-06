import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'search' | 'select';
  options?: FilterOption[];
  placeholder?: string;
}

interface FiltersProps {
  configs: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  configs,
  values,
  onChange,
  onClear,
}) => {
  const hasActiveFilters = Object.values(values).some(value => value && value !== 'all');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {configs.map((config) => (
            <div key={config.key} className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">
                {config.label}
              </label>
              
              {config.type === 'search' ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={config.placeholder || `Buscar ${config.label.toLowerCase()}...`}
                    value={values[config.key] || ''}
                    onChange={(e) => onChange(config.key, e.target.value)}
                    className="pl-10"
                  />
                </div>
              ) : (
                <Select
                  value={values[config.key] || 'all'}
                  onValueChange={(value) => onChange(config.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {config.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};