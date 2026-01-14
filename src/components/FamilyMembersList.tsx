import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Crown, User } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface FamilyMember {
  id: string;
  user_id: string;
  role_label: string;
  permission_level: string;
  invite_email: string | null;
  invite_status: string;
}

export const FamilyMembersList = () => {
  const { language } = useLanguage();
  const { family } = useFamily();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    en: {
      owner: 'Owner',
      admin: 'Admin',
      viewer: 'Viewer',
      pending: 'Pending',
      no_members: 'No additional members yet',
      remove: 'Remove',
      removed: 'Member removed',
      remove_error: 'Failed to remove member',
      you: '(You)',
    },
    ru: {
      owner: 'Владелец',
      admin: 'Админ',
      viewer: 'Просмотр',
      pending: 'Ожидание',
      no_members: 'Нет дополнительных участников',
      remove: 'Удалить',
      removed: 'Участник удалён',
      remove_error: 'Ошибка удаления',
      you: '(Вы)',
    }
  }[language];

  useEffect(() => {
    const fetchMembers = async () => {
      if (!family?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', family.id);
        
        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [family?.id]);

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      setMembers(members.filter(m => m.id !== memberId));
      toast.success(t.removed);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(t.remove_error);
    }
  };

  const isOwner = family?.owner_user_id === user?.id;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-2">
      {/* Show owner */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium flex items-center gap-1">
              {user?.email?.split('@')[0] || language === 'ru' ? 'Вы' : 'You'}
              {isOwner && <span className="text-muted-foreground text-sm">{t.you}</span>}
            </p>
            <Badge variant="secondary" className="text-xs">{t.owner}</Badge>
          </div>
        </div>
      </div>

      {/* Show other members */}
      {members.map((member) => (
        <div 
          key={member.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {member.role_label}
                {member.invite_status === 'pending' && member.invite_email && (
                  <span className="text-muted-foreground text-sm ml-1">({member.invite_email})</span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <Badge 
                  variant={member.permission_level === 'admin' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {member.permission_level === 'admin' ? t.admin : t.viewer}
                </Badge>
                {member.invite_status === 'pending' && (
                  <Badge variant="outline" className="text-xs">{t.pending}</Badge>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <Button 
              size="icon" 
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handleRemoveMember(member.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">{t.no_members}</p>
      )}
    </div>
  );
};
