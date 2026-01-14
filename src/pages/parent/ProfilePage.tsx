import { useState } from 'react';
import { User, Users, CreditCard, Settings, UserPlus, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { AddChildDialog } from '@/components/AddChildDialog';
import { EditChildProfileDialog } from '@/components/EditChildProfileDialog';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { InviteMemberDialog } from '@/components/InviteMemberDialog';
import { FamilyMembersList } from '@/components/FamilyMembersList';

export const ProfilePage = () => {
  const { language } = useLanguage();
  const { children } = useApp();
  const { family, updateFamily } = useFamily();
  const { user } = useAuth();
  
  const [familyName, setFamilyName] = useState(family?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editingChild, setEditingChild] = useState<typeof children[0] | null>(null);
  const [allowParentActivities, setAllowParentActivities] = useState(family?.allow_parent_activities || false);
  
  const t = {
    en: {
      profile: 'Profile',
      profile_desc: 'Manage your family settings and members',
      family_name: 'Family Name',
      family_name_desc: 'The name displayed for your family',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved!',
      save_error: 'Failed to save',
      children_management: 'Children',
      children_management_desc: 'Manage child profiles and avatars',
      add_child: 'Add Child',
      edit: 'Edit',
      subscription: 'Subscription',
      subscription_desc: 'Manage your subscription and billing',
      current_plan: 'Current Plan',
      free_plan: 'Free Plan',
      manage_billing: 'Manage Billing',
      account_settings: 'Account Settings',
      account_settings_desc: 'Email, password, and profile',
      email: 'Email',
      change_password: 'Change Password',
      family_members: 'Family Members',
      family_members_desc: 'Invite other parents or caregivers',
      invite_member: 'Invite Member',
      parent_activities: 'Parent Activities',
      parent_activities_desc: 'Allow creating activities for parents (visible only in parent calendar)',
      google_calendar: 'Google Calendar',
      google_calendar_desc: 'Sync your schedule with Google Calendar',
      connect_google: 'Connect Google Calendar',
      coming_soon: 'Coming Soon',
    },
    ru: {
      profile: 'Профиль',
      profile_desc: 'Управление настройками семьи',
      family_name: 'Название семьи',
      family_name_desc: 'Отображаемое название вашей семьи',
      save: 'Сохранить',
      saving: 'Сохранение...',
      saved: 'Сохранено!',
      save_error: 'Ошибка сохранения',
      children_management: 'Дети',
      children_management_desc: 'Управление профилями детей',
      add_child: 'Добавить ребёнка',
      edit: 'Редактировать',
      subscription: 'Подписка',
      subscription_desc: 'Управление подпиской и оплатой',
      current_plan: 'Текущий план',
      free_plan: 'Бесплатный',
      manage_billing: 'Управление оплатой',
      account_settings: 'Настройки аккаунта',
      account_settings_desc: 'Email, пароль и профиль',
      email: 'Email',
      change_password: 'Изменить пароль',
      family_members: 'Члены семьи',
      family_members_desc: 'Пригласите других родителей или опекунов',
      invite_member: 'Пригласить',
      parent_activities: 'Занятия родителей',
      parent_activities_desc: 'Разрешить создание занятий для родителей (видны только в календаре родителя)',
      google_calendar: 'Google Календарь',
      google_calendar_desc: 'Синхронизация расписания с Google Calendar',
      connect_google: 'Подключить Google Calendar',
      coming_soon: 'Скоро',
    }
  }[language];

  const handleSaveFamilyName = async () => {
    if (!family?.id || !familyName.trim()) return;
    
    setIsSaving(true);
    try {
      await updateFamily.mutateAsync({ id: family.id, name: familyName.trim() });
      toast.success(t.saved);
    } catch (error) {
      toast.error(t.save_error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleParentActivities = async (checked: boolean) => {
    if (!family?.id) return;
    
    setAllowParentActivities(checked);
    try {
      await updateFamily.mutateAsync({ id: family.id, allow_parent_activities: checked });
      toast.success(t.saved);
    } catch (error) {
      setAllowParentActivities(!checked);
      toast.error(t.save_error);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t.profile}</h1>
          <p className="text-sm text-muted-foreground">{t.profile_desc}</p>
        </div>
      </div>

      {/* Family Name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t.family_name}
          </CardTitle>
          <CardDescription>{t.family_name_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={family?.name || ''}
            />
            <Button 
              onClick={handleSaveFamilyName}
              disabled={isSaving || !familyName.trim() || familyName === family?.name}
            >
              {isSaving ? t.saving : t.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Children Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t.children_management}
              </CardTitle>
              <CardDescription>{t.children_management_desc}</CardDescription>
            </div>
            <AddChildDialog 
              trigger={
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-1" />
                  {t.add_child}
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {children.map((child) => (
              <div 
                key={child.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <ChildAvatar avatar={child.avatar_url || '🦁'} size="md" />
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-muted-foreground">{child.balance} {language === 'ru' ? 'монет' : 'coins'}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setEditingChild(child)}
                >
                  {t.edit}
                </Button>
              </div>
            ))}
            {children.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === 'ru' ? 'Нет детей. Добавьте первого ребёнка!' : 'No children yet. Add your first child!'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Family Members / Invite */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t.family_members}
              </CardTitle>
              <CardDescription>{t.family_members_desc}</CardDescription>
            </div>
            <InviteMemberDialog
              trigger={
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-1" />
                  {t.invite_member}
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <FamilyMembersList />
        </CardContent>
      </Card>

      {/* Parent Activities Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t.parent_activities}
          </CardTitle>
          <CardDescription>{t.parent_activities_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="parent-activities">
              {language === 'ru' ? 'Включить занятия родителей' : 'Enable parent activities'}
            </Label>
            <Switch
              id="parent-activities"
              checked={allowParentActivities}
              onCheckedChange={handleToggleParentActivities}
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Sync */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t.google_calendar}
          </CardTitle>
          <CardDescription>{t.google_calendar_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled className="w-full">
            {t.connect_google}
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">{t.coming_soon}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t.account_settings}
          </CardTitle>
          <CardDescription>{t.account_settings_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">{t.email}</Label>
            <p className="font-medium">{user?.email || '-'}</p>
          </div>
          <Separator />
          <Button variant="outline" disabled className="w-full">
            {t.change_password}
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">{t.coming_soon}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {t.subscription}
          </CardTitle>
          <CardDescription>{t.subscription_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">{t.current_plan}</Label>
            <p className="font-medium">{t.free_plan}</p>
          </div>
          <Button variant="outline" disabled className="w-full">
            {t.manage_billing}
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">{t.coming_soon}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Edit Child Dialog */}
      {editingChild && (
        <EditChildProfileDialog
          child={editingChild}
          open={!!editingChild}
          onOpenChange={(open) => !open && setEditingChild(null)}
        />
      )}
    </div>
  );
};
