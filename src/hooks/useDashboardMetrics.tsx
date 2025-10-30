import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";

export const useDashboardMetrics = (dateRange?: { from?: Date; to?: Date }) => {
  const startDate = dateRange?.from || subDays(new Date(), 30);
  const endDate = dateRange?.to || new Date();

  // Stabilize query key to avoid endless refetch loops
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  return useQuery({
    queryKey: ["dashboard-metrics", startIso, endIso],
    queryFn: async () => {
      // Fetch API requests within date range
      const { data: requests, error } = await supabase
        .from("api_requests")
        .select(`
          *,
          models!inner(display_name, provider_id),
          providers!inner(display_name),
          business_units(name)
        `)
        .gte("request_timestamp", startDate.toISOString())
        .lte("request_timestamp", endDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const totalSpend = requests?.reduce((sum, r) => sum + Number(r.cost), 0) || 0;
      const totalRequests = requests?.length || 0;
      const avgCostPerRequest = totalRequests > 0 ? totalSpend / totalRequests : 0;

      // Get unique business units count
      const uniqueBUs = new Set(requests?.map(r => r.business_unit_id).filter(Boolean));
      const activeProjects = uniqueBUs.size;

      // Spending trend (last 7 days)
      const spendingTrend = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(endDate, 6 - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayRequests = requests?.filter(r => {
          const reqDate = new Date(r.request_timestamp);
          return reqDate >= dayStart && reqDate <= dayEnd;
        }) || [];
        
        const amount = dayRequests.reduce((sum, r) => sum + Number(r.cost), 0);
        
        return {
          date: format(dayStart, "MMM d"),
          amount: Math.round(amount * 100) / 100,
        };
      });

      // Provider distribution
      const providerMap = new Map<string, { name: string; value: number; color: string }>();
      const colors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
      ];
      
      requests?.forEach(r => {
        const providerName = r.providers?.display_name || "Unknown";
        if (!providerMap.has(providerName)) {
          providerMap.set(providerName, {
            name: providerName,
            value: 0,
            color: colors[providerMap.size % colors.length],
          });
        }
        const provider = providerMap.get(providerName)!;
        provider.value += Number(r.cost);
      });

      const providerData = Array.from(providerMap.values());

      // Model usage
      const modelMap = new Map<string, number>();
      requests?.forEach(r => {
        const modelName = r.models?.display_name || "Unknown";
        modelMap.set(modelName, (modelMap.get(modelName) || 0) + 1);
      });

      const modelUsage = Array.from(modelMap.entries()).map(([model, requests]) => ({
        model,
        requests,
      }));

      // Get budgets
      const { data: budgets } = await supabase
        .from("budgets")
        .select(`
          *,
          business_units(name)
        `)
        .gte("period_start", startOfMonth(new Date()).toISOString().split("T")[0])
        .lte("period_end", endOfMonth(new Date()).toISOString().split("T")[0]);

      const budgetProgress = budgets?.map(b => ({
        name: b.business_units?.name || "Unknown",
        spent: Number(b.spent_amount),
        budget: Number(b.allocated_amount),
      })) || [];

      return {
        totalSpend,
        totalRequests,
        avgCostPerRequest,
        activeProjects,
        spendingTrend,
        providerData,
        modelUsage,
        budgetProgress,
      };
    },
  });
};
