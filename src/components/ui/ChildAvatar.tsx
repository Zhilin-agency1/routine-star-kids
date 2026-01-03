import { cn } from "@/lib/utils";

interface ChildAvatarProps {
  avatar: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
    xs: 'w-8 h-8 text-lg',
    sm: 'w-11 h-11 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-28 h-28 text-6xl',
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div 
        className={cn(
          "rounded-full bg-primary/30 flex items-center justify-center",
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
