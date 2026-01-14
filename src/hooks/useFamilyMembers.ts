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

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  activity_color: string | null;
  parent_activities_enabled: boolean;
}

export interface EligibleAdult {
  id: string;
  userId: string;
  name: string;
  isOwner: boolean;
  isSelf: boolean;
  activityColor: string;
  parentActivitiesEnabled: boolean;
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

  // Fetch profiles for eligible adults (those with parent_activities_enabled)
  const { data: profiles = [] } = useQuery({
    queryKey: ['eligible_adult_profiles', family?.id],
    queryFn: async () => {
      if (!family?.id) return [];
      
      // Collect all user IDs we need profiles for
      const userIds: string[] = [];
      if (family.owner_user_id) userIds.push(family.owner_user_id);
      members.forEach(m => {
        if (m.user_id && !userIds.includes(m.user_id)) {
          userIds.push(m.user_id);
        }
      });
      
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, activity_color, parent_activities_enabled')
        .in('user_id', userIds);
      
      if (error) throw error;
      return (data as Profile[]) || [];
    },
    enabled: !!family?.id && members.length >= 0,
  });

  // Check if current user is owner or admin
  const isOwnerOrAdmin = family?.owner_user_id === user?.id || 
    members.some(m => m.user_id === user?.id && m.permission_level === 'admin');

  // Get current user's member record
  const currentUserMember = members.find(m => m.user_id === user?.id);

  // Parent activities enabled at family level?
  const allowParentActivities = family?.allow_parent_activities ?? false;

  // Get profile for a user ID
  const getProfileForUser = (userId: string): Profile | undefined => {
    return profiles.find(p => p.user_id === userId);
  };

  // Get adults available for task assignment
  // Returns user IDs (not prefixed) - the UI will handle display
  const getAvailableAdults = (): EligibleAdult[] => {
    if (!allowParentActivities || !user) return [];
    
    const adults: EligibleAdult[] = [];
    
    // Add owner (always available if parent activities is on)
    if (family?.owner_user_id) {
      const ownerProfile = getProfileForUser(family.owner_user_id);
      adults.push({
        id: `parent:${family.owner_user_id}`, // For dropdown value
        userId: family.owner_user_id, // Actual user ID for DB
        name: ownerProfile?.full_name || 'Owner',
        isOwner: true,
        isSelf: family.owner_user_id === user.id,
        activityColor: ownerProfile?.activity_color || '#8B5CF6',
        parentActivitiesEnabled: ownerProfile?.parent_activities_enabled ?? false,
      });
    }
    
    // Add accepted members
    members.forEach(member => {
      // Skip if this is the owner (already added)
      if (member.user_id === family?.owner_user_id) return;
      
      // For non-admin users, only show themselves
      if (!isOwnerOrAdmin && member.user_id !== user.id) return;
      
      const memberProfile = getProfileForUser(member.user_id);
      adults.push({
        id: `parent:${member.user_id}`, // For dropdown value
        userId: member.user_id, // Actual user ID for DB
        name: memberProfile?.full_name || member.role_label,
        isOwner: false,
        isSelf: member.user_id === user.id,
        activityColor: memberProfile?.activity_color || '#8B5CF6',
        parentActivitiesEnabled: memberProfile?.parent_activities_enabled ?? false,
      });
    });
    
    return adults;
  };

  // Get adults eligible for calendar filter (those with parent_activities_enabled)
  const getEligibleAdultsForCalendar = (): EligibleAdult[] => {
    if (!allowParentActivities) return [];
    
    return getAvailableAdults().filter(adult => adult.parentActivitiesEnabled);
  };

  // Get current user's profile
  const currentUserProfile = user ? getProfileForUser(user.id) : undefined;

  return {
    members,
    profiles,
    isLoading,
    error,
    refetch,
    isOwnerOrAdmin,
    currentUserMember,
    currentUserProfile,
    allowParentActivities,
    getAvailableAdults,
    getEligibleAdultsForCalendar,
    getProfileForUser,
  };
};
