import { useState, useEffect } from 'react';
import { User, Users, CreditCard, Settings, UserPlus, Calendar, Palette, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { useChildren, type Child } from '@/hooks/useChildren';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { supabase } from '@/integrations/supabase/client';
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
import { ColorPicker } from '@/components/ColorPicker';

export const ProfilePage = () => {
  const { language } = useLanguage();
  const { children } = useApp();
  const { updateChild } = useChildren();
  const { family, updateFamily } = useFamily();
  const { user } = useAuth();
  const { currentUserProfile, isOwnerOrAdmin, allowParentActivities, refetch: refetchMembers } = useFamilyMembers();
  const navigate = useNavigate();
  
  const [familyName, setFamilyName] = useState(family?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editingChild, setEditingChild] = useState<typeof children[0] | null>(null);
  const [allowParentActivitiesLocal, setAllowParentActivitiesLocal] = useState(family?.allow_parent_activities || false);
  const [parentActivitiesEnabled, setParentActivitiesEnabled] = useState(currentUserProfile?.parent_activities_enabled ?? false);
  const [myActivityColor, setMyActivityColor] = useState(currentUserProfile?.activity_color || '#8B5CF6');
  const [childColors, setChildColors] = useState<Record<string, string>>({});
  
  // Initialize child colors from data
  useEffect(() => {
    const colors: Record<string, string> = {};
    children.forEach((child: any) => {
      colors[child.id] = child.color || '#3B82F6';
    });
    setChildColors(colors);
  }, [children]);
  
  // Sync parent activities enabled from profile
  useEffect(() => {
    if (currentUserProfile) {
      setParentActivitiesEnabled(currentUserProfile.parent_activities_enabled ?? false);
      setMyActivityColor(currentUserProfile.activity_color || '#8B5CF6');
    }
  }, [currentUserProfile]);
  
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
      colors: 'Colors',
      colors_desc: 'Customize calendar colors for children and your activities',
      children_colors: 'Children Colors',
      my_activity_color: 'My Activity Color',
      enable_parent_activities_for_me: 'Enable parent activities for me',
      enable_parent_activities_for_me_desc: 'Show my activities in my calendar filter',
      security_privacy: 'Security & Privacy',
      security_privacy_desc: 'Manage your data, export, and account deletion',
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
      colors: 'Цвета',
      colors_desc: 'Настройте цвета календаря для детей и ваших занятий',
      children_colors: 'Цвета детей',
      my_activity_color: 'Цвет моих занятий',
      enable_parent_activities_for_me: 'Включить мои занятия',
      enable_parent_activities_for_me_desc: 'Показывать мои занятия в фильтре календаря',
      security_privacy: 'Безопасность и конфиденциальность',
      security_privacy_desc: 'Управление данными, экспорт и удаление аккаунта',
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
    
    setAllowParentActivitiesLocal(checked);
    try {
      await updateFamily.mutateAsync({ id: family.id, allow_parent_activities: checked });
      toast.success(t.saved);
    } catch (error) {
      setAllowParentActivitiesLocal(!checked);
      toast.error(t.save_error);
    }
  };

  const handleToggleMyParentActivities = async (checked: boolean) => {
    if (!user?.id) return;
    
    setParentActivitiesEnabled(checked);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ parent_activities_enabled: checked })
        .eq('user_id', user.id);
      
      if (error) throw error;
      refetchMembers();
      toast.success(t.saved);
    } catch (error) {
      setParentActivitiesEnabled(!checked);
      toast.error(t.save_error);
    }
  };

  const handleChildColorChange = async (childId: string, color: string) => {
    setChildColors(prev => ({ ...prev, [childId]: color }));
    try {
      await updateChild.mutateAsync({ id: childId, color });
      toast.success(t.saved);
    } catch (error) {
      toast.error(t.save_error);
    }
  };

  const handleMyColorChange = async (color: string) => {
    if (!user?.id) return;
    
    setMyActivityColor(color);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ activity_color: color })
        .eq('user_id', user.id);
      
      if (error) throw error;
      refetchMembers();
      toast.success(t.saved);
    } catch (error) {
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
        <CardContent className="space-y-4">
          {/* Family-level toggle (owner/admin only) */}
          {isOwnerOrAdmin && (
            <div className="flex items-center justify-between">
              <Label htmlFor="parent-activities">
                {language === 'ru' ? 'Включить занятия родителей' : 'Enable parent activities'}
              </Label>
              <Switch
                id="parent-activities"
                checked={allowParentActivitiesLocal}
                onCheckedChange={handleToggleParentActivities}
              />
            </div>
          )}
          
          {/* Personal toggle - only visible when family-level is enabled */}
          {allowParentActivities && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="my-parent-activities" className="block">
                    {t.enable_parent_activities_for_me}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.enable_parent_activities_for_me_desc}
                  </p>
                </div>
                <Switch
                  id="my-parent-activities"
                  checked={parentActivitiesEnabled}
                  onCheckedChange={handleToggleMyParentActivities}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {t.colors}
          </CardTitle>
          <CardDescription>{t.colors_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Children colors (admin only) */}
          {isOwnerOrAdmin && children.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t.children_colors}</Label>
              <div className="space-y-2">
                {children.map((child) => (
                  <div 
                    key={child.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <ChildAvatar avatar={child.avatar_url || '🦁'} size="sm" />
                      <span className="text-sm">{child.name}</span>
                    </div>
                    <ColorPicker
                      color={childColors[child.id] || '#3B82F6'}
                      onChange={(color) => handleChildColorChange(child.id, color)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* My activity color - only when parent activities enabled */}
          {allowParentActivities && parentActivitiesEnabled && (
            <>
              {isOwnerOrAdmin && children.length > 0 && <Separator />}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t.my_activity_color}</Label>
                <ColorPicker
                  color={myActivityColor}
                  onChange={handleMyColorChange}
                />
              </div>
            </>
          )}
          
          {/* Empty state */}
          {(!isOwnerOrAdmin || children.length === 0) && (!allowParentActivities || !parentActivitiesEnabled) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {language === 'ru' 
                ? 'Нет доступных настроек цвета' 
                : 'No color settings available'}
            </p>
          )}
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

      {/* Security & Privacy */}
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/parent/security')}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t.security_privacy}
              </CardTitle>
              <CardDescription>{t.security_privacy_desc}</CardDescription>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
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
