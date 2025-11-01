import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Budget {
  id?: string;
  business_unit_id?: string;
  provider_id?: string;
  period_start: string;
  period_end: string;
  allocated_amount: number;
  spent_amount?: number;
}

export const useBudgets = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, business_units(name), providers(display_name)")
        .order("period_start", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: Budget) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("budgets")
        .insert({
          ...values,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Budget & { id: string }) => {
      const { data, error } = await supabase
        .from("budgets")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    budgets: query.data,
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
