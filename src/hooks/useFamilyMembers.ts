import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from './useFamily';
import { useAuth } from './useAuth';

interface FamilyMember {
  id: string;
  user_id: string;
  role_label: string;
  permission_level: string;
  invite_status: string;
}

export const useFamilyMembers = () => {
  const { family } = useFamily();
  const { user } = useAuth();

  const { data: members = [], isLoading, error, refetch } = useQuery({
    queryKey: ['family_members', family?.id],
    queryFn: async () => {
      if (!family?.id) return [];
      
      // Use the secure VIEW that excludes sensitive fields
      const { data, error } = await supabase
        .from('family_members_public' as 'family_members')
        .select('id, user_id, role_label, permission_level, invite_status')
        .eq('family_id', family.id)
        .eq('invite_status', 'accepted'); // Only accepted members
      
      if (error) throw error;
      return (data as FamilyMember[]) || [];
    },
    enabled: !!family?.id,
  });

  // Check if current user is owner or admin
  const isOwnerOrAdmin = family?.owner_user_id === user?.id || 
    members.some(m => m.user_id === user?.id && m.permission_level === 'admin');

  // Get current user's member record
  const currentUserMember = members.find(m => m.user_id === user?.id);

  // Parent activities enabled?
  const allowParentActivities = family?.allow_parent_activities ?? false;

  // Get adults available for task assignment
  // - Owner is always available if parent activities enabled
  // - Admin/non-admin members: admin can see all, non-admin only sees self
  // Get adults available for task assignment
  // Returns user IDs (not prefixed) - the UI will handle display
  const getAvailableAdults = () => {
    if (!allowParentActivities || !user) return [];
    
    const adults: { id: string; userId: string; name: string; isOwner: boolean; isSelf: boolean }[] = [];
    
    // Add owner (always available)
    if (family?.owner_user_id) {
      adults.push({
        id: `parent:${family.owner_user_id}`, // For dropdown value
        userId: family.owner_user_id, // Actual user ID for DB
        name: 'Owner', // Will be translated in UI
        isOwner: true,
        isSelf: family.owner_user_id === user.id,
      });
    }
    
    // Add accepted members
    members.forEach(member => {
      // Skip if this is the owner (already added)
      if (member.user_id === family?.owner_user_id) return;
      
      // For non-admin users, only show themselves
      if (!isOwnerOrAdmin && member.user_id !== user.id) return;
      
      adults.push({
        id: `parent:${member.user_id}`, // For dropdown value
        userId: member.user_id, // Actual user ID for DB
        name: member.role_label,
        isOwner: false,
        isSelf: member.user_id === user.id,
      });
    });
    
    return adults;
  };

  return {
    members,
    isLoading,
    error,
    refetch,
    isOwnerOrAdmin,
    currentUserMember,
    allowParentActivities,
    getAvailableAdults,
  };
};
