import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';
import { AddStoreItemDialog } from '@/components/AddStoreItemDialog';
import { EditStoreItemDialog } from '@/components/EditStoreItemDialog';
import { useStore, type StoreItem } from '@/hooks/useStore';
import { useChildren } from '@/hooks/useChildren';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const ParentStorePage = () => {
  const { t, language } = useLanguage();
  const { items, deleteItem } = useStore();
  const { children } = useChildren();
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<StoreItem | null>(null);

  const getChildName = (childId: string | null) => {
    if (!childId) return null;
    return children.find(c => c.id === childId)?.name || null;
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await deleteItem.mutateAsync(deletingItem.id);
      toast.success(language === 'ru' ? 'Товар удалён' : 'Item deleted');
      setDeletingItem(null);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка при удалении' : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav_store')}</h1>
        <AddStoreItemDialog />
      </div>

      {/* Store Items */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">🛍️</p>
            <p>{language === 'ru' ? 'Нет товаров в магазине' : 'No items in store'}</p>
            <p className="text-sm">{language === 'ru' ? 'Добавьте первый товар' : 'Add your first item'}</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.id}
              className="bg-card rounded-2xl p-4 shadow-card interactive-card animate-fade-in-up flex items-center gap-4"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div className="text-4xl flex-shrink-0">{item.image_url || '🎁'}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{language === 'ru' ? item.name_ru : item.name_en}</h3>
                {/* Child assignment label */}
                {(() => {
                  const childName = getChildName((item as any).child_id);
                  return childName ? (
                    <span className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'для' : 'for'} {childName}
                    </span>
                  ) : null;
                })()}
                <CoinBadge amount={item.price} size="sm" />
              </div>

              {/* Status */}
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.active 
                  ? 'bg-success/20 text-success' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {item.active 
                  ? (language === 'ru' ? 'Активен' : 'Active') 
                  : (language === 'ru' ? 'Скрыт' : 'Hidden')}
              </span>

              {/* Actions */}
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => setEditingItem(item)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-destructive"
                  onClick={() => setDeletingItem(item)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <EditStoreItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить товар?' : 'Delete item?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? `Вы уверены, что хотите удалить "${deletingItem?.name_ru}"? Это действие нельзя отменить.`
                : `Are you sure you want to delete "${deletingItem?.name_en}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};