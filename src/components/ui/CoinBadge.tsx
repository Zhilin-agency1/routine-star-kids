import { cn } from "@/lib/utils";

interface CoinBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showPlus?: boolean;
  className?: string;
  animate?: boolean;
}

export const CoinBadge = ({ 
  amount, 
  size = 'md', 
  showPlus = false,
  className,
  animate = false
}: CoinBadgeProps) => {
  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5 gap-1',
    md: 'text-base px-3 py-1 gap-1.5',
    lg: 'text-xl px-4 py-2 gap-2',
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full bg-coin/20 text-coin-foreground font-bold",
        sizeClasses[size],
        animate && "animate-bounce-in",
        className
      )}
    >
      <span className={cn(iconSizes[size], animate && "animate-coin-spin")}>🪙</span>
      <span>{showPlus && amount > 0 ? '+' : ''}{amount}</span>
    </div>
  );
};
