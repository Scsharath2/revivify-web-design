import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RequestFilters {
  dateRange?: { from?: Date; to?: Date };
  providers?: string[];
  businessUnits?: string[];
  models?: string[];
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
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

      if (filters.providers && filters.providers.length > 0) {
        filteredData = filteredData.filter(r => 
          filters.providers?.includes(r.providers?.display_name || "")
        );
      }

      if (filters.businessUnits && filters.businessUnits.length > 0) {
        filteredData = filteredData.filter(r => 
          filters.businessUnits?.includes(r.business_units?.name || "")
        );
      }

      if (filters.models && filters.models.length > 0) {
        filteredData = filteredData.filter(r => 
          filters.models?.includes(r.models?.display_name || "")
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

      // Apply sorting
      if (filters.sortBy) {
        filteredData.sort((a, b) => {
          let aVal: any;
          let bVal: any;

          switch (filters.sortBy) {
            case "timestamp":
              aVal = new Date(a.request_timestamp).getTime();
              bVal = new Date(b.request_timestamp).getTime();
              break;
            case "cost":
              aVal = Number(a.cost);
              bVal = Number(b.cost);
              break;
            case "tokens":
              aVal = a.total_tokens;
              bVal = b.total_tokens;
              break;
            case "provider":
              aVal = a.providers?.display_name || "";
              bVal = b.providers?.display_name || "";
              break;
            case "model":
              aVal = a.models?.display_name || "";
              bVal = b.models?.display_name || "";
              break;
            default:
              return 0;
          }

          if (filters.sortOrder === "asc") {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }

      // Total count before pagination
      const totalCount = filteredData.length;

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

      return { data: paginatedData, totalCount };
    },
  });
};
