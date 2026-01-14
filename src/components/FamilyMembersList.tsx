import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Crown, User, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
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

// Using family_members_public VIEW - excludes sensitive fields (invite_email, invite_token)
interface FamilyMember {
  id: string;
  user_id: string;
  role_label: string;
  permission_level: string;
  invite_status: string;
}

export const FamilyMembersList = () => {
  const { language } = useLanguage();
  const { family } = useFamily();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const t = {
    en: {
      owner: 'Owner',
      admin: 'Admin',
      viewer: 'Viewer',
      pending: 'Pending',
      invited: 'invited',
      no_members: 'No additional members yet',
      remove: 'Remove',
      revoke: 'Revoke Invitation',
      removed: 'Member removed',
      revoked: 'Invitation revoked',
      remove_error: 'Failed to remove member',
      you: '(You)',
      confirm_remove_title: 'Remove Member',
      confirm_revoke_title: 'Revoke Invitation',
      confirm_remove_desc: 'Are you sure you want to remove this member from your family? They will lose access to all family data.',
      confirm_revoke_desc: 'Are you sure you want to revoke this invitation? The invited person will no longer be able to join your family.',
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
    ru: {
      owner: 'Владелец',
      admin: 'Админ',
      viewer: 'Просмотр',
      pending: 'Ожидание',
      invited: 'приглашён',
      no_members: 'Нет дополнительных участников',
      remove: 'Удалить',
      revoke: 'Отозвать приглашение',
      removed: 'Участник удалён',
      revoked: 'Приглашение отозвано',
      remove_error: 'Ошибка удаления',
      you: '(Вы)',
      confirm_remove_title: 'Удалить участника',
      confirm_revoke_title: 'Отозвать приглашение',
      confirm_remove_desc: 'Вы уверены, что хотите удалить этого участника из семьи? Он потеряет доступ ко всем данным семьи.',
      confirm_revoke_desc: 'Вы уверены, что хотите отозвать это приглашение? Приглашённый человек больше не сможет присоединиться к вашей семье.',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
    }
  }[language];

  const fetchMembers = async () => {
    if (!family?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Use the secure VIEW that excludes sensitive fields (invite_email, invite_token)
      const { data, error } = await supabase
        .from('family_members_public' as 'family_members')
        .select('id, user_id, role_label, permission_level, invite_status')
        .eq('family_id', family.id);
      
      if (error) throw error;
      setMembers((data as FamilyMember[]) || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [family?.id]);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberToRemove.id);
      
      if (error) throw error;
      
      setMembers(members.filter(m => m.id !== memberToRemove.id));
      
      const isPending = memberToRemove.invite_status === 'pending';
      toast.success(isPending ? t.revoked : t.removed);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(t.remove_error);
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  const isOwner = family?.owner_user_id === user?.id;
  const isPendingInvite = memberToRemove?.invite_status === 'pending';

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div>;
  }

  return (
    <>
      <div className="space-y-2">
        {/* Show owner */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium flex items-center gap-1">
                {user?.email?.split('@')[0] || (language === 'ru' ? 'Вы' : 'You')}
                {isOwner && <span className="text-muted-foreground text-sm">{t.you}</span>}
              </p>
              <Badge variant="secondary" className="text-xs">{t.owner}</Badge>
            </div>
          </div>
        </div>

        {/* Show other members */}
        {members.map((member) => {
          const isPending = member.invite_status === 'pending';
          
          return (
            <div 
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPending ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-muted'}`}>
                  <User className={`w-4 h-4 ${isPending ? 'text-orange-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {member.role_label}
                    {isPending && (
                      <span className="text-muted-foreground text-sm ml-1">({t.invited})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={member.permission_level === 'admin' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {member.permission_level === 'admin' ? t.admin : t.viewer}
                    </Badge>
                    {isPending && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">{t.pending}</Badge>
                    )}
                  </div>
                </div>
              </div>
              {isOwner && (
                <Button 
                  size="sm" 
                  variant={isPending ? 'outline' : 'ghost'}
                  className={isPending ? 'text-orange-600 hover:text-orange-700 border-orange-300' : 'text-destructive hover:text-destructive'}
                  onClick={() => setMemberToRemove(member)}
                >
                  {isPending ? (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      {t.revoke}
                    </>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">{t.no_members}</p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPendingInvite ? t.confirm_revoke_title : t.confirm_remove_title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPendingInvite ? t.confirm_revoke_desc : t.confirm_remove_desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className={isPendingInvite ? 'bg-orange-600 hover:bg-orange-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {isRemoving ? '...' : t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
