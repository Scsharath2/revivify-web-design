import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RequestFilters {
  dateRange?: { from?: Date; to?: Date };
  provider?: string;
  businessUnit?: string;
  searchQuery?: string;
}

export const useApiRequests = (filters: RequestFilters) => {
  return useQuery({
    queryKey: ["api-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("api_requests")
        .select(`
          *,
          models!inner(display_name),
          providers!inner(display_name),
          business_units(name)
        `)
        .order("request_timestamp", { ascending: false })
        .limit(100);

      // Apply date range filter
      if (filters.dateRange?.from) {
        query = query.gte("request_timestamp", filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte("request_timestamp", filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply client-side filters
      let filteredData = data || [];

      if (filters.provider && filters.provider !== "all") {
        filteredData = filteredData.filter(r => 
          r.providers?.display_name.toLowerCase() === filters.provider?.toLowerCase()
        );
      }

      if (filters.businessUnit && filters.businessUnit !== "all") {
        filteredData = filteredData.filter(r => 
          r.business_units?.name.toLowerCase() === filters.businessUnit?.toLowerCase()
        );
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(r =>
          r.id.toLowerCase().includes(query) ||
          r.models?.display_name.toLowerCase().includes(query) ||
          r.providers?.display_name.toLowerCase().includes(query)
        );
      }

      return filteredData;
    },
  });
};
