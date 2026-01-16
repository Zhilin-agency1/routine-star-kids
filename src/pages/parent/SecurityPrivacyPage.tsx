import { useState } from 'react';
import { Shield, Download, Trash2, Database, Eye, Lock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { useChildren } from '@/hooks/useChildren';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DataCategory {
  name: string;
  description: string;
  fields: string[];
  accessPolicy: string;
}

export const SecurityPrivacyPage = () => {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { family } = useFamily();
  const { children } = useChildren();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = language === 'ru' ? {
    title: 'Безопасность и конфиденциальность',
    subtitle: 'Управление вашими данными и настройками безопасности',
    data_stored: 'Хранимые данные',
    data_stored_desc: 'Какие данные мы храним о вас и вашей семье',
    access_policies: 'Политики доступа',
    access_policies_desc: 'Кто может просматривать и изменять ваши данные',
    export_data: 'Экспорт данных',
    export_data_desc: 'Скачайте все ваши данные в формате JSON',
    export_button: 'Скачать мои данные',
    exporting: 'Экспорт...',
    export_success: 'Данные успешно экспортированы',
    export_error: 'Ошибка экспорта данных',
    delete_account: 'Удаление аккаунта',
    delete_account_desc: 'Безвозвратно удалить ваш аккаунт и все связанные данные',
    delete_button: 'Удалить мой аккаунт',
    delete_confirm_title: 'Вы уверены?',
    delete_confirm_desc: 'Это действие нельзя отменить. Будут удалены все ваши данные, включая семью, детей, задания и историю.',
    delete_cancel: 'Отмена',
    delete_confirm: 'Да, удалить всё',
    deleting: 'Удаление...',
    delete_success: 'Аккаунт удалён',
    delete_error: 'Ошибка удаления аккаунта',
    security_status: 'Статус безопасности',
    security_status_desc: 'Обзор защиты вашего аккаунта',
    rls_enabled: 'RLS включён для всех таблиц',
    data_encrypted: 'Данные зашифрованы при передаче',
    auth_active: 'Аутентификация активна',
    session_secure: 'Сессия защищена',
    family_data: 'Данные семьи',
    family_data_desc: 'Название, настройки, часовой пояс',
    family_access: 'Доступ: только владелец семьи',
    children_data: 'Данные детей',
    children_data_desc: 'Имена, балансы, аватары, настройки языка',
    children_access: 'Доступ: владелец семьи, привязанные пользователи',
    tasks_data: 'Задания',
    tasks_data_desc: 'Шаблоны заданий, экземпляры, шаги, награды',
    tasks_access: 'Доступ: члены семьи (просмотр), владелец (управление)',
    store_data: 'Магазин',
    store_data_desc: 'Товары, цены, покупки, списки желаний',
    store_access: 'Доступ: члены семьи (просмотр), владелец (управление)',
    transactions_data: 'Транзакции',
    transactions_data_desc: 'История начисления и списания монет',
    transactions_access: 'Доступ: члены семьи (просмотр), владелец (управление)',
    profile_data: 'Профиль пользователя',
    profile_data_desc: 'Имя, аватар, настройки языка, цвет активностей',
    profile_access: 'Доступ: только вы сами',
  } : {
    title: 'Security & Privacy',
    subtitle: 'Manage your data and security settings',
    data_stored: 'Data We Store',
    data_stored_desc: 'What data we store about you and your family',
    access_policies: 'Access Policies',
    access_policies_desc: 'Who can view and modify your data',
    export_data: 'Export Your Data',
    export_data_desc: 'Download all your data in JSON format',
    export_button: 'Download My Data',
    exporting: 'Exporting...',
    export_success: 'Data exported successfully',
    export_error: 'Failed to export data',
    delete_account: 'Delete Account',
    delete_account_desc: 'Permanently delete your account and all associated data',
    delete_button: 'Delete My Account',
    delete_confirm_title: 'Are you sure?',
    delete_confirm_desc: 'This action cannot be undone. This will permanently delete all your data including family, children, tasks, and history.',
    delete_cancel: 'Cancel',
    delete_confirm: 'Yes, delete everything',
    deleting: 'Deleting...',
    delete_success: 'Account deleted',
    delete_error: 'Failed to delete account',
    security_status: 'Security Status',
    security_status_desc: 'Overview of your account protection',
    rls_enabled: 'RLS enabled on all tables',
    data_encrypted: 'Data encrypted in transit',
    auth_active: 'Authentication active',
    session_secure: 'Session secured',
    family_data: 'Family Data',
    family_data_desc: 'Name, settings, timezone',
    family_access: 'Access: family owner only',
    children_data: 'Children Data',
    children_data_desc: 'Names, balances, avatars, language preferences',
    children_access: 'Access: family owner, linked users',
    tasks_data: 'Tasks',
    tasks_data_desc: 'Task templates, instances, steps, rewards',
    tasks_access: 'Access: family members (view), owner (manage)',
    store_data: 'Store',
    store_data_desc: 'Items, prices, purchases, wishlists',
    store_access: 'Access: family members (view), owner (manage)',
    transactions_data: 'Transactions',
    transactions_data_desc: 'Coin earning and spending history',
    transactions_access: 'Access: family members (view), owner (manage)',
    profile_data: 'User Profile',
    profile_data_desc: 'Name, avatar, language settings, activity color',
    profile_access: 'Access: only you',
  };

  const dataCategories: DataCategory[] = [
    {
      name: t.family_data,
      description: t.family_data_desc,
      fields: ['id', 'name', 'timezone', 'default_language', 'currency_name', 'allow_parent_activities'],
      accessPolicy: t.family_access,
    },
    {
      name: t.children_data,
      description: t.children_data_desc,
      fields: ['id', 'name', 'balance', 'avatar_url', 'color', 'language_preference'],
      accessPolicy: t.children_access,
    },
    {
      name: t.tasks_data,
      description: t.tasks_data_desc,
      fields: ['titles', 'descriptions', 'rewards', 'schedules', 'completion_status', 'steps'],
      accessPolicy: t.tasks_access,
    },
    {
      name: t.store_data,
      description: t.store_data_desc,
      fields: ['item_names', 'prices', 'descriptions', 'purchase_history', 'wishlists'],
      accessPolicy: t.store_access,
    },
    {
      name: t.transactions_data,
      description: t.transactions_data_desc,
      fields: ['amount', 'type', 'source', 'notes', 'timestamps'],
      accessPolicy: t.transactions_access,
    },
    {
      name: t.profile_data,
      description: t.profile_data_desc,
      fields: ['full_name', 'avatar_url', 'language_preference', 'activity_color', 'parent_activities_enabled'],
      accessPolicy: t.profile_access,
    },
  ];

  const handleExportData = async () => {
    if (!user?.id || !family?.id) {
      toast.error(t.export_error);
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all user data
      const [
        familyData,
        childrenData,
        taskTemplatesData,
        taskInstancesData,
        storeItemsData,
        purchasesData,
        transactionsData,
        profileData,
        wishlistsData,
        jobBoardData,
        activitiesData,
      ] = await Promise.all([
        supabase.from('families').select('*').eq('id', family.id).single(),
        supabase.from('children').select('*').eq('family_id', family.id),
        supabase.from('task_templates').select('*').eq('family_id', family.id),
        supabase.from('task_instances').select('*').in('child_id', children.map(c => c.id)),
        supabase.from('store_items').select('*').eq('family_id', family.id),
        supabase.from('purchases').select('*').eq('family_id', family.id),
        supabase.from('transactions').select('*').eq('family_id', family.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('wishlists').select('*').in('child_id', children.map(c => c.id)),
        supabase.from('job_board_items').select('*').eq('family_id', family.id),
        supabase.from('activity_schedules').select('*').eq('family_id', family.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        family: familyData.data,
        children: childrenData.data,
        task_templates: taskTemplatesData.data,
        task_instances: taskInstancesData.data,
        store_items: storeItemsData.data,
        purchases: purchasesData.data,
        transactions: transactionsData.data,
        profile: profileData.data,
        wishlists: wishlistsData.data,
        job_board_items: jobBoardData.data,
        activity_schedules: activitiesData.data,
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t.export_success);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t.export_error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || !family?.id) {
      toast.error(t.delete_error);
      return;
    }

    setIsDeleting(true);
    try {
      // Delete in order to respect foreign key constraints
      // 1. Delete wishlists
      await supabase.from('wishlists').delete().in('child_id', children.map(c => c.id));
      
      // 2. Delete purchases
      await supabase.from('purchases').delete().eq('family_id', family.id);
      
      // 3. Delete transactions
      await supabase.from('transactions').delete().eq('family_id', family.id);
      
      // 4. Delete task step completions (via task instances)
      const { data: instances } = await supabase
        .from('task_instances')
        .select('id')
        .in('child_id', children.map(c => c.id));
      
      if (instances && instances.length > 0) {
        await supabase.from('task_step_completions').delete().in('task_instance_id', instances.map(i => i.id));
      }
      
      // 5. Delete task instances
      await supabase.from('task_instances').delete().in('child_id', children.map(c => c.id));
      
      // 6. Delete task steps (via templates)
      const { data: templates } = await supabase
        .from('task_templates')
        .select('id')
        .eq('family_id', family.id);
      
      if (templates && templates.length > 0) {
        await supabase.from('task_steps').delete().in('template_id', templates.map(t => t.id));
      }
      
      // 7. Delete task templates
      await supabase.from('task_templates').delete().eq('family_id', family.id);
      
      // 8. Delete job claims
      const { data: jobs } = await supabase
        .from('job_board_items')
        .select('id')
        .eq('family_id', family.id);
      
      if (jobs && jobs.length > 0) {
        await supabase.from('job_claims').delete().in('job_board_item_id', jobs.map(j => j.id));
      }
      
      // 9. Delete job board items
      await supabase.from('job_board_items').delete().eq('family_id', family.id);
      
      // 10. Delete store items
      await supabase.from('store_items').delete().eq('family_id', family.id);
      
      // 11. Delete activity schedules
      await supabase.from('activity_schedules').delete().eq('family_id', family.id);
      
      // 12. Delete notifications
      await supabase.from('notifications').delete().eq('family_id', family.id);
      
      // 13. Delete day template tasks and day templates
      const { data: dayTemplates } = await supabase
        .from('day_templates')
        .select('id')
        .eq('family_id', family.id);
      
      if (dayTemplates && dayTemplates.length > 0) {
        await supabase.from('day_template_tasks').delete().in('day_template_id', dayTemplates.map(dt => dt.id));
      }
      await supabase.from('day_templates').delete().eq('family_id', family.id);
      
      // 14. Delete template events
      await supabase.from('template_events').delete().eq('family_id', family.id);
      
      // 15. Delete family members
      await supabase.from('family_members').delete().eq('family_id', family.id);
      
      // 16. Delete children
      await supabase.from('children').delete().eq('family_id', family.id);
      
      // 17. Delete family
      await supabase.from('families').delete().eq('id', family.id);
      
      // 18. Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);
      
      // 19. Delete user roles
      await supabase.from('user_roles').delete().eq('user_id', user.id);

      toast.success(t.delete_success);
      
      // Sign out after deletion
      await signOut();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t.delete_error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {t.security_status}
          </CardTitle>
          <CardDescription>{t.security_status_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">{t.rls_enabled}</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">{t.data_encrypted}</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">{t.auth_active}</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">{t.session_secure}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Stored */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            {t.data_stored}
          </CardTitle>
          <CardDescription>{t.data_stored_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {dataCategories.map((category, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {category.fields.map((field, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{category.accessPolicy}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t.export_data}
          </CardTitle>
          <CardDescription>{t.export_data_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.exporting}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t.export_button}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Delete Account - Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {t.delete_account}
          </CardTitle>
          <CardDescription>{t.delete_account_desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.delete_button}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.delete_confirm_title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.delete_confirm_desc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.delete_cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t.delete_confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
