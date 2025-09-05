import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from './loading-spinner';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { TableColumn, BulkAction } from '@/types';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onBulkDelete?: (items: T[]) => void;
  bulkActions?: BulkAction<T>[];
  getItemId: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  onEdit,
  onDelete,
  onBulkDelete,
  bulkActions,
  getItemId,
  emptyMessage = "Nenhum item encontrado",
  className = ""
}: DataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(getItemId));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkAction = (action: BulkAction<T>) => {
    const selectedData = data.filter(item => 
      selectedItems.has(getItemId(item))
    );
    action.action(selectedData);
    setSelectedItems(new Set());
    setShowBulkActions(false);
  };

  const selectedCount = selectedItems.size;
  const isAllSelected = selectedCount > 0 && selectedCount === data.length;
  const isPartiallySelected = selectedCount > 0 && selectedCount < data.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <div className="w-12 h-12 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
              <path d="M3 3h18v18H3z" />
              <path d="m8 8 8 8" />
              <path d="m16 8-8 8" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bulk Actions */}
      {selectedCount > 0 && (bulkActions || onBulkDelete) && (
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              {bulkActions?.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={() => handleBulkAction(action)}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
              {onBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const selectedData = data.filter(item => 
                      selectedItems.has(getItemId(item))
                    );
                    onBulkDelete(selectedData);
                    setSelectedItems(new Set());
                  }}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Selecionados
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Select All Checkbox */}
              {(onBulkDelete || bulkActions) && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected || isPartiallySelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              
              {/* Column Headers */}
              {columns.map((column) => (
                <TableHead key={String(column.key)}>
                  {column.label}
                </TableHead>
              ))}
              
              {/* Actions Column */}
              {(onEdit || onDelete) && (
                <TableHead className="w-12">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {data.map((item) => {
              const itemId = getItemId(item);
              const isSelected = selectedItems.has(itemId);
              
              return (
                <TableRow 
                  key={itemId}
                  className={isSelected ? "bg-muted/50" : ""}
                >
                  {/* Select Checkbox */}
                  {(onBulkDelete || bulkActions) && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => 
                          handleSelectItem(itemId, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  
                  {/* Data Cells */}
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '-')
                      }
                    </TableCell>
                  ))}
                  
                  {/* Actions Cell */}
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(item)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}