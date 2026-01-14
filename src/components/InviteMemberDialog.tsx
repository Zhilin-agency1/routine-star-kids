import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Copy, Mail } from 'lucide-react';

interface InviteMemberDialogProps {
  trigger: React.ReactNode;
}

export const InviteMemberDialog = ({ trigger }: InviteMemberDialogProps) => {
  const { language } = useLanguage();
  const { family } = useFamily();
  
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'viewer' | 'admin'>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const t = {
    en: {
      invite_title: 'Invite Family Member',
      invite_desc: 'Invite another parent or caregiver to help manage your family',
      email: 'Email address',
      email_placeholder: 'parent@example.com',
      role_label: 'Role label',
      role_label_placeholder: 'e.g. Dad, Grandma, Nanny',
      role_label_desc: 'How this person will be displayed in the family',
      permission: 'Permission level',
      viewer: 'Viewer + Self tasks',
      viewer_desc: 'Can view calendar and add their own activities',
      admin: 'Admin',
      admin_desc: 'Full access to manage kids, schedules, and store',
      send_invite: 'Send Invite',
      sending: 'Sending...',
      invite_sent: 'Invitation sent!',
      invite_error: 'Failed to send invitation',
      copy_link: 'Copy invite link',
      link_copied: 'Link copied!',
      or: 'or',
    },
    ru: {
      invite_title: 'Пригласить члена семьи',
      invite_desc: 'Пригласите другого родителя или опекуна для управления семьёй',
      email: 'Email адрес',
      email_placeholder: 'parent@example.com',
      role_label: 'Роль',
      role_label_placeholder: 'напр. Папа, Бабушка, Няня',
      role_label_desc: 'Как этот человек будет отображаться в семье',
      permission: 'Уровень доступа',
      viewer: 'Просмотр + свои задачи',
      viewer_desc: 'Может просматривать календарь и добавлять свои занятия',
      admin: 'Администратор',
      admin_desc: 'Полный доступ к управлению детьми, расписанием и магазином',
      send_invite: 'Отправить приглашение',
      sending: 'Отправка...',
      invite_sent: 'Приглашение отправлено!',
      invite_error: 'Ошибка отправки приглашения',
      copy_link: 'Скопировать ссылку',
      link_copied: 'Ссылка скопирована!',
      or: 'или',
    }
  }[language];

  const handleSendInvite = async () => {
    if (!family?.id || !email.trim()) return;
    
    setIsInviting(true);
    try {
      const inviteToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: (await supabase.auth.getUser()).data.user?.id, // Temporary, will be updated when user accepts
          role_label: roleLabel.trim() || (language === 'ru' ? 'Родитель' : 'Parent'),
          permission_level: permissionLevel,
          invite_email: email.trim(),
          invite_token: inviteToken,
          invite_status: 'pending',
          invited_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast.success(t.invite_sent);
      setOpen(false);
      setEmail('');
      setRoleLabel('');
      setPermissionLevel('viewer');
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(t.invite_error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!family?.id) return;
    
    const inviteToken = crypto.randomUUID();
    const inviteLink = `${window.location.origin}/invite/${inviteToken}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t.link_copied);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.invite_title}</DialogTitle>
          <DialogDescription>{t.invite_desc}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email_placeholder}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role-label">{t.role_label}</Label>
            <Input
              id="role-label"
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              placeholder={t.role_label_placeholder}
            />
            <p className="text-xs text-muted-foreground">{t.role_label_desc}</p>
          </div>
          
          <div className="space-y-2">
            <Label>{t.permission}</Label>
            <Select value={permissionLevel} onValueChange={(v) => setPermissionLevel(v as 'viewer' | 'admin')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div className="flex flex-col items-start">
                    <span>{t.viewer}</span>
                    <span className="text-xs text-muted-foreground">{t.viewer_desc}</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span>{t.admin}</span>
                    <span className="text-xs text-muted-foreground">{t.admin_desc}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleSendInvite}
              disabled={isInviting || !email.trim()}
            >
              <Mail className="w-4 h-4 mr-2" />
              {isInviting ? t.sending : t.send_invite}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">{t.or}</span>
              <div className="flex-1 border-t" />
            </div>
            
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              {t.copy_link}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
