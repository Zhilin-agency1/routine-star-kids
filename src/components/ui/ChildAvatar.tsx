import { cn } from "@/lib/utils";

interface ChildAvatarProps {
  avatar: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export const ChildAvatar = ({ 
  avatar, 
  name,
  size = 'md',
  className,
  showName = false
}: ChildAvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div 
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-soft",
          sizeClasses[size]
        )}
      >
        {avatar}
      </div>
      {showName && name && (
        <span className="text-sm font-semibold text-foreground">{name}</span>
      )}
    </div>
  );
};
