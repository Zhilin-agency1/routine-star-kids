import { useEffect, useState } from 'react';
import { Loader2, Home, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const FamilySetup = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { family, isLoading, createFamily } = useFamily();
  const [familyName, setFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Show setup if user is logged in, loading is done, and no family exists
    if (user && !isLoading && !family) {
      setShowSetup(true);
    } else {
      setShowSetup(false);
    }
  }, [user, isLoading, family]);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      toast.error('Введите название семьи');
      return;
    }

    setIsCreating(true);
    try {
      await createFamily.mutateAsync({
        name: familyName.trim(),
      });
      toast.success('Семья создана!');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания семьи');
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading while checking family status
  if (user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Show family setup if user is logged in but has no family
  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Добро пожаловать!</h1>
            <p className="text-muted-foreground mt-2">
              Давайте создадим вашу семью для начала работы
            </p>
          </div>

          {/* Setup Card */}
          <div className="bg-card rounded-3xl shadow-xl p-6 border border-border">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="family-name">Название семьи</Label>
                <Input
                  id="family-name"
                  type="text"
                  placeholder="Семья Ивановых"
                  className="rounded-xl"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                />
                <p className="text-xs text-muted-foreground">
                  Вы сможете изменить это позже в настройках
                </p>
              </div>

              <Button
                onClick={handleCreateFamily}
                disabled={isCreating || !familyName.trim()}
                className="w-full rounded-xl h-12 text-lg font-semibold"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Home className="w-5 h-5 mr-2" />
                )}
                Создать семью
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 bg-card/50 rounded-2xl p-4 border border-border">
            <h3 className="font-semibold mb-2">Что дальше?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Добавьте детей в вашу семью</li>
              <li>• Создайте задания и расписание</li>
              <li>• Настройте награды в магазине</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // User has a family, render children
  return <>{children}</>;
};
