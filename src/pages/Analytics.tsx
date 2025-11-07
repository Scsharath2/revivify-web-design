import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, TrendingUp, TrendingDown, DollarSign, Activity, Target, AlertCircle, RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useAnalytics } from "@/hooks/useAnalytics";
import { format, subMonths, subDays } from "date-fns";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LoadingCard } from "@/components/LoadingCard";

const Analytics = () => {
  const [selectedFilter, setSelectedFilter] = useState("3m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const computedRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { from: dateRange.from, to: dateRange.to };
    }
    const now = new Date();
    switch (selectedFilter) {
      case "24h":
        return { from: subDays(now, 1), to: now };
      case "7d":
        return { from: subDays(now, 7), to: now };
      case "1m":
        return { from: subMonths(now, 1), to: now };
      case "3m":
        return { from: subMonths(now, 3), to: now };
      default:
        return { from: subMonths(now, 3), to: now };
    }
  }, [selectedFilter, dateRange]);

  const { data: analytics, isLoading, error, isFetching } = useAnalytics(computedRange);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setDateRange(undefined);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedFilter("");
  };

  const handleExportReport = () => {
    if (!analytics) {
      toast.error("No data to export");
      return;
    }

    const report = {
      summary: {
        totalCost: analytics.totalCost,
        totalRequests: analytics.totalRequests,
        avgCostPerRequest: analytics.avgCostPerRequest,
      },
      predictions: analytics.predictions,
      providerStats: analytics.providerStats,
      businessUnitStats: analytics.businessUnitStats,
      modelStats: analytics.modelStats,
      costDistribution: analytics.costDistribution,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-report-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Analytics report exported");
  };

  const handleExportCSV = (dataType: string) => {
    if (!analytics) {
      toast.error("No data to export");
      return;
    }

    let csvContent = "";
    let filename = "";

    switch (dataType) {
      case "daily":
        csvContent = [
          "Date,Cost,Requests",
          ...analytics.dailyCosts.map(d => `${d.date},${d.cost},${d.requests}`)
        ].join("\n");
        filename = "daily-costs.csv";
        break;
      case "monthly":
        csvContent = [
          "Month,Cost,Requests",
          ...analytics.monthlyCosts.map(m => `${m.month},${m.cost},${m.requests}`)
        ].join("\n");
        filename = "monthly-costs.csv";
        break;
      case "providers":
        csvContent = [
          "Provider,Cost,Requests,Avg Cost per Request",
          ...analytics.providerStats.map(p => `${p.name},${p.cost},${p.requests},${p.avgCost}`)
        ].join("\n");
        filename = "provider-stats.csv";
        break;
      case "models":
        csvContent = [
          "Model,Cost,Requests,Avg Cost per Request",
          ...analytics.modelStats.map(m => `${m.name},${m.cost},${m.requests},${m.avgCost}`)
        ].join("\n");
        filename = "model-stats.csv";
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filename}`);
  };

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">Advanced cost analysis and predictions</p>
            </div>
            {isFetching && (
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            )}
          </div>
          <Button onClick={handleExportReport} variant="outline" className="hover-scale">
            <Download className="h-4 w-4 mr-2" />
            Export Full Report
          </Button>
        </div>

        {/* Filters */}
        <div className="animate-fade-in animate-stagger-1">
          <FilterBar
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {isLoading && !analytics ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading analytics</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load analytics data. Please try again."}
            </AlertDescription>
          </Alert>
        ) : !analytics || analytics.totalRequests === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
              <p className="text-muted-foreground">
                Analytics will appear here once you have API requests in the selected date range.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="trends" className="space-y-6">
            <TabsList>
              <TabsTrigger value="trends">Cost Trends</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="reports">Custom Reports</TabsTrigger>
            </TabsList>

            {/* Cost Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
                <Card className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {analytics.totalRequests.toLocaleString()} requests
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.avgCostPerRequest.toFixed(4)}</div>
                    <p className="text-xs text-muted-foreground">
                      P99: ${analytics.costDistribution.p99}
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Trend</CardTitle>
                    {analytics.predictions.trend === "increasing" ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : analytics.predictions.trend === "decreasing" ? (
                      <TrendingDown className="h-4 w-4 text-success" />
                    ) : (
                      <Target className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{analytics.predictions.trend}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg monthly: ${analytics.predictions.avgMonthlyCost}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Cost Trend */}
              <Card className="animate-fade-in animate-stagger-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Daily Cost Trend</CardTitle>
                    <CardDescription>Cost and request volume over time</CardDescription>
                  </div>
                  <Button onClick={() => handleExportCSV("daily")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.dailyCosts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} name="Cost ($)" />
                      <Line type="monotone" dataKey="requests" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Requests" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 animate-fade-in">
                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle>Next Month Prediction</CardTitle>
                    <CardDescription>Projected cost for next month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${analytics.predictions.nextMonth}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on {analytics.predictions.avgMonthlyRequests} avg monthly requests
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle>3-Month Projection</CardTitle>
                    <CardDescription>Projected cost for next 3 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent">
                      ${analytics.predictions.next3Months}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Trend: {analytics.predictions.trend}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="animate-fade-in animate-stagger-1">
                <CardHeader>
                  <CardTitle>Predictive Budgeting</CardTitle>
                  <CardDescription>Forecast and budget recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Recommended Monthly Budget</h4>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ${Math.ceil(analytics.predictions.nextMonth * 1.2)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      20% buffer above predicted cost
                    </p>
                  </div>

                  <div className="border-l-4 border-chart-2 pl-4">
                    <h4 className="font-semibold">Quarterly Budget Recommendation</h4>
                    <p className="text-2xl font-bold text-chart-2 mt-1">
                      ${Math.ceil(analytics.predictions.next3Months * 1.15)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      15% buffer above 3-month projection
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Cost Optimization Tips</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Monitor high-cost requests (P99: ${analytics.costDistribution.p99})</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Review provider costs - top provider accounts for majority of spend</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Set up alerts for anomalous spending patterns</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Top Models by Cost */}
                <Card className="animate-fade-in">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Top Models by Cost</CardTitle>
                      <CardDescription>Highest cost models</CardDescription>
                    </div>
                    <Button onClick={() => handleExportCSV("models")} variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.modelStats.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {analytics.modelStats.slice(0, 5).map((model) => (
                        <div key={model.name} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate">{model.name}</span>
                          <div className="flex gap-3">
                            <span className="font-semibold">${model.cost.toFixed(2)}</span>
                            <span className="text-muted-foreground">{model.requests} req</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Business Unit Breakdown */}
                <Card className="animate-fade-in animate-stagger-1">
                  <CardHeader>
                    <CardTitle>Business Unit Breakdown</CardTitle>
                    <CardDescription>Cost by business unit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.businessUnitStats.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Bar dataKey="cost" fill="hsl(var(--chart-2))" name="Cost ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Model Stats Table */}
              <Card className="animate-fade-in animate-stagger-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Model Performance</CardTitle>
                    <CardDescription>Usage and cost by model</CardDescription>
                  </div>
                  <Button onClick={() => handleExportCSV("models")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Model</th>
                          <th className="text-right py-3 px-4 font-semibold">Requests</th>
                          <th className="text-right py-3 px-4 font-semibold">Total Cost</th>
                          <th className="text-right py-3 px-4 font-semibold">Avg Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.modelStats.map(model => (
                          <tr key={model.name} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{model.name}</td>
                            <td className="py-3 px-4 text-right">{model.requests.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-semibold">${model.cost}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground">${model.avgCost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>Export customized analytics data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button onClick={() => handleExportCSV("daily")} variant="outline" className="justify-start h-auto py-4">
                      <div className="text-left">
                        <div className="font-semibold">Daily Cost Report</div>
                        <div className="text-sm text-muted-foreground">Daily breakdown of costs and requests</div>
                      </div>
                    </Button>

                    <Button onClick={() => handleExportCSV("monthly")} variant="outline" className="justify-start h-auto py-4">
                      <div className="text-left">
                        <div className="font-semibold">Monthly Summary Report</div>
                        <div className="text-sm text-muted-foreground">Monthly aggregated data</div>
                      </div>
                    </Button>

                    <Button onClick={() => handleExportCSV("providers")} variant="outline" className="justify-start h-auto py-4">
                      <div className="text-left">
                        <div className="font-semibold">Provider Analysis</div>
                        <div className="text-sm text-muted-foreground">Detailed provider statistics</div>
                      </div>
                    </Button>

                    <Button onClick={() => handleExportCSV("models")} variant="outline" className="justify-start h-auto py-4">
                      <div className="text-left">
                        <div className="font-semibold">Model Performance Report</div>
                        <div className="text-sm text-muted-foreground">Usage and cost by model</div>
                      </div>
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <Button onClick={handleExportReport} className="w-full" size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      Export Complete Analytics Report (JSON)
                    </Button>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Includes all analytics data, predictions, and breakdowns
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
