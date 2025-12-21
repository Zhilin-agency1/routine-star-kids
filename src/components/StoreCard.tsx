import { ShoppingCart, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp, StoreItem } from '@/contexts/AppContext';
import { CoinBadge } from './ui/CoinBadge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface StoreCardProps {
  item: StoreItem;
  onPurchase?: () => void;
}

export const StoreCard = ({ item, onPurchase }: StoreCardProps) => {
  const { language, t } = useLanguage();
  const { currentChild, purchaseItem } = useApp();

  const name = item.name[language];
  const balance = currentChild?.balance || 0;
  const canAfford = balance >= item.price;
  const progress = Math.min((balance / item.price) * 100, 100);
  const coinsNeeded = item.price - balance;

  const handlePurchase = () => {
    if (canAfford) {
      purchaseItem(item.id);
      onPurchase?.();
    }
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-2xl p-4 shadow-card interactive-card border-2",
        canAfford ? "border-success/30" : "border-transparent"
      )}
    >
      {/* Image/Icon */}
      <div className="text-5xl text-center mb-3 animate-float">
        {item.imageUrl}
      </div>

      {/* Name */}
      <h3 className="font-bold text-center text-lg mb-2">{name}</h3>

      {/* Price */}
      <div className="flex justify-center mb-3">
        <CoinBadge amount={item.price} size="md" />
      </div>

      {/* Progress to purchase */}
      {!canAfford && (
        <div className="mb-3">
          <Progress value={progress} className="h-2 mb-1" />
          <p className="text-xs text-center text-muted-foreground">
            {coinsNeeded} {t('coins_to_go')}
          </p>
        </div>
      )}

      {/* Buy Button */}
      <Button
        onClick={handlePurchase}
        disabled={!canAfford}
        className={cn(
          "w-full rounded-xl font-bold transition-all",
          canAfford 
            ? "bg-success hover:bg-success/90 text-success-foreground" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {canAfford ? (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('buy')}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            {t('not_enough')}
          </>
        )}
      </Button>
    </div>
  );
};
