import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { MetricCard } from "@/components/MetricCard";
import { BudgetProgress } from "@/components/BudgetProgress";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingCard, LoadingChart } from "@/components/LoadingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Zap, Users, Database } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { subDays, subMonths } from "date-fns";

const Dashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState("1m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

// Calculate and memoize date range based on filter
  const computedRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { from: dateRange.from, to: dateRange.to };
    }
    const today = new Date();
    switch (selectedFilter) {
      case "24h":
        return { from: subDays(today, 1), to: today };
      case "7d":
        return { from: subDays(today, 7), to: today };
      case "30d":
        return { from: subDays(today, 30), to: today };
      case "3m":
        return { from: subMonths(today, 3), to: today };
      default:
        return { from: subMonths(today, 1), to: today };
    }
  }, [selectedFilter, dateRange]);

  const { data: metrics, isLoading } = useDashboardMetrics(computedRange);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingChart key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const hasNoData = !metrics || (metrics.totalRequests === 0 && metrics.totalSpend === 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your AI spending and usage metrics</p>
        </div>

        {/* Filter Bar */}
        <div className="animate-fade-in animate-stagger-1">
          <FilterBar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {hasNoData ? (
          <div className="animate-fade-up">
            <EmptyState
              icon={Database}
              title="No Data Available"
              description="Start tracking your AI spending by making API requests. Once you have data, you'll see detailed metrics and analytics here."
            />
          </div>
        ) : (
          <>

        {/* Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in animate-stagger-1">
            <MetricCard
              title="Total Spend"
              value={`$${metrics?.totalSpend.toFixed(2) || "0.00"}`}
              icon={<DollarSign className="h-5 w-5" />}
            />
          </div>
          <div className="animate-fade-in animate-stagger-2">
            <MetricCard
              title="Total Requests"
              value={metrics?.totalRequests.toLocaleString() || "0"}
              icon={<Zap className="h-5 w-5" />}
            />
          </div>
          <div className="animate-fade-in animate-stagger-3">
            <MetricCard
              title="Avg Cost/Request"
              value={`$${metrics?.avgCostPerRequest.toFixed(2) || "0.00"}`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
          <div className="animate-fade-in animate-stagger-4">
            <MetricCard
              title="Active Projects"
              value={metrics?.activeProjects.toString() || "0"}
              icon={<Users className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spending Trend */}
          <Card className="animate-fade-in hover-lift">
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics?.spendingTrend || []}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Provider Distribution */}
          <Card className="animate-fade-in animate-stagger-1 hover-lift">
            <CardHeader>
              <CardTitle>Spending by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.providerData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(metrics?.providerData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(metrics?.providerData || []).map((provider) => (
                  <div key={provider.name} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: provider.color }}
                    />
                    <span className="text-sm text-muted-foreground">{provider.name}</span>
                    <span className="ml-auto text-sm font-semibold">${provider.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model Usage */}
          <Card className="animate-fade-in animate-stagger-2 hover-lift">
            <CardHeader>
              <CardTitle>Requests by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.modelUsage || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="model" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="requests" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Progress */}
          <div className="animate-fade-in animate-stagger-3">
            <BudgetProgress items={metrics?.budgetProgress || []} />
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
