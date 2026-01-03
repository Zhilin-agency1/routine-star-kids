import { ShoppingBag, ArrowLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { StoreCard } from '@/components/StoreCard';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';

export const StorePage = () => {
  const { t, language } = useLanguage();
  const { storeItems, currentChild, tasks } = useApp();
  const navigate = useNavigate();

  const activeItems = storeItems.filter(item => item.active);
  const balance = currentChild?.balance || 0;
  
  // Check if child has unfinished tasks today
  const childTasks = tasks.filter(task => task.childId === currentChild?.id);
  const pendingTasks = childTasks.filter(t => t.state !== 'done');
  const hasPendingTasks = pendingTasks.length > 0;
  
  // Find cheapest affordable item
  const cheapestAffordable = activeItems
    .filter(item => item.price <= balance)
    .sort((a, b) => a.price - b.price)[0];
  
  // Find closest to afford
  const closestToAfford = activeItems
    .filter(item => item.price > balance)
    .sort((a, b) => a.price - b.price)[0];
  
  const coinsNeededForClosest = closestToAfford ? closestToAfford.price - balance : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('store_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('balance')}:</p>
          </div>
        </div>
        {currentChild && (
          <CoinBadge amount={currentChild.balance} size="lg" />
        )}
      </div>

      {/* Helpful message if balance is low */}
      {!cheapestAffordable && closestToAfford && (
        <div className="bg-muted/50 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {language === 'ru' 
              ? `Тебе нужно ещё ${coinsNeededForClosest} монет` 
              : `You need ${coinsNeededForClosest} more coins`}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="min-h-[44px]"
          >
            <Target className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'К заданиям' : 'Back to Today'}
          </Button>
        </div>
      )}

      {/* Store Grid */}
      <div className="grid grid-cols-2 gap-4">
        {activeItems.map((item, index) => (
          <div 
            key={item.id} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <StoreCard item={item} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {activeItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Магазин пуст' : 'Store is empty'}
          </p>
        </div>
      )}
    </div>
  );
};
