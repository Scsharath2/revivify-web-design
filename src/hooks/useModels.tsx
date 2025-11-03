import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useModels = () => {
  return useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (error) throw error;
      return data;
    },
  });
};
