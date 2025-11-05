import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, addMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

export const useAnalytics = (dateRange?: { from?: Date; to?: Date }) => {
  const startDate = dateRange?.from || subMonths(new Date(), 3);
  const endDate = dateRange?.to || new Date();

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  return useQuery({
    queryKey: ["analytics", startIso, endIso],
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

      // Daily cost trend
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyCosts = days.map(day => {
        const dayStart = new Date(day.setHours(0, 0, 0, 0));
        const dayEnd = new Date(day.setHours(23, 59, 59, 999));
        
        const dayRequests = requests?.filter(r => {
          const reqDate = new Date(r.request_timestamp);
          return reqDate >= dayStart && reqDate <= dayEnd;
        }) || [];
        
        const cost = dayRequests.reduce((sum, r) => sum + Number(r.cost), 0);
        const requestCount = dayRequests.length;
        
        return {
          date: format(dayStart, "MMM d"),
          cost: Math.round(cost * 100) / 100,
          requests: requestCount,
        };
      });

      // Monthly aggregation
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const monthlyCosts = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthRequests = requests?.filter(r => {
          const reqDate = new Date(r.request_timestamp);
          return reqDate >= monthStart && reqDate <= monthEnd;
        }) || [];
        
        const cost = monthRequests.reduce((sum, r) => sum + Number(r.cost), 0);
        const requestCount = monthRequests.length;
        
        return {
          month: format(monthStart, "MMM yyyy"),
          cost: Math.round(cost * 100) / 100,
          requests: requestCount,
        };
      });

      // Calculate trend and prediction
      const recentMonths = monthlyCosts.slice(-3);
      const avgMonthlyCost = recentMonths.reduce((sum, m) => sum + m.cost, 0) / recentMonths.length;
      const avgMonthlyRequests = recentMonths.reduce((sum, m) => sum + m.requests, 0) / recentMonths.length;

      // Simple linear regression for prediction
      const costTrend = recentMonths.length > 1 
        ? (recentMonths[recentMonths.length - 1].cost - recentMonths[0].cost) / recentMonths.length
        : 0;

      const nextMonthPrediction = Math.max(0, avgMonthlyCost + costTrend);
      const next3MonthsPrediction = Math.max(0, avgMonthlyCost * 3 + costTrend * 6);

      // Provider breakdown
      const providerBreakdown = new Map<string, { cost: number; requests: number; avgCost: number }>();
      requests?.forEach(r => {
        const providerName = r.providers?.display_name || "Unknown";
        const current = providerBreakdown.get(providerName) || { cost: 0, requests: 0, avgCost: 0 };
        current.cost += Number(r.cost);
        current.requests += 1;
        current.avgCost = current.cost / current.requests;
        providerBreakdown.set(providerName, current);
      });

      const providerStats = Array.from(providerBreakdown.entries()).map(([name, stats]) => ({
        name,
        cost: Math.round(stats.cost * 100) / 100,
        requests: stats.requests,
        avgCost: Math.round(stats.avgCost * 10000) / 10000,
      })).sort((a, b) => b.cost - a.cost);

      // Business unit breakdown
      const businessUnitBreakdown = new Map<string, { cost: number; requests: number }>();
      requests?.forEach(r => {
        const buName = r.business_units?.name || "Unassigned";
        const current = businessUnitBreakdown.get(buName) || { cost: 0, requests: 0 };
        current.cost += Number(r.cost);
        current.requests += 1;
        businessUnitBreakdown.set(buName, current);
      });

      const businessUnitStats = Array.from(businessUnitBreakdown.entries()).map(([name, stats]) => ({
        name,
        cost: Math.round(stats.cost * 100) / 100,
        requests: stats.requests,
      })).sort((a, b) => b.cost - a.cost);

      // Model usage and cost
      const modelBreakdown = new Map<string, { cost: number; requests: number; avgCost: number }>();
      requests?.forEach(r => {
        const modelName = r.models?.display_name || "Unknown";
        const current = modelBreakdown.get(modelName) || { cost: 0, requests: 0, avgCost: 0 };
        current.cost += Number(r.cost);
        current.requests += 1;
        current.avgCost = current.cost / current.requests;
        modelBreakdown.set(modelName, current);
      });

      const modelStats = Array.from(modelBreakdown.entries()).map(([name, stats]) => ({
        name,
        cost: Math.round(stats.cost * 100) / 100,
        requests: stats.requests,
        avgCost: Math.round(stats.avgCost * 10000) / 10000,
      })).sort((a, b) => b.cost - a.cost);

      // Cost distribution (percentiles)
      const costs = requests?.map(r => Number(r.cost)).sort((a, b) => a - b) || [];
      const p50 = costs[Math.floor(costs.length * 0.5)] || 0;
      const p90 = costs[Math.floor(costs.length * 0.9)] || 0;
      const p99 = costs[Math.floor(costs.length * 0.99)] || 0;

      return {
        dailyCosts,
        monthlyCosts,
        totalCost: requests?.reduce((sum, r) => sum + Number(r.cost), 0) || 0,
        totalRequests: requests?.length || 0,
        avgCostPerRequest: requests?.length ? 
          (requests.reduce((sum, r) => sum + Number(r.cost), 0) / requests.length) : 0,
        predictions: {
          nextMonth: Math.round(nextMonthPrediction * 100) / 100,
          next3Months: Math.round(next3MonthsPrediction * 100) / 100,
          avgMonthlyCost: Math.round(avgMonthlyCost * 100) / 100,
          avgMonthlyRequests: Math.round(avgMonthlyRequests),
          trend: costTrend > 0 ? "increasing" : costTrend < 0 ? "decreasing" : "stable",
        },
        providerStats,
        businessUnitStats,
        modelStats,
        costDistribution: {
          p50: Math.round(p50 * 10000) / 10000,
          p90: Math.round(p90 * 10000) / 10000,
          p99: Math.round(p99 * 10000) / 10000,
        },
      };
    },
  });
};
