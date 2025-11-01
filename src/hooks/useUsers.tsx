import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserRole = "admin" | "analyst" | "viewer";

interface UserRoleUpdate {
  userId: string;
  role: UserRole;
}

export const useUsers = () => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role as UserRole) || [],
      }));

      return usersWithRoles;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: UserRoleUpdate) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: UserRoleUpdate) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    users: usersQuery.data,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    addRole: addRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAddingRole: addRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
};
