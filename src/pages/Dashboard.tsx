import { useState } from "react";
import { Layout } from "@/components/Layout";
import { MetricCard } from "@/components/MetricCard";
import { BudgetProgress } from "@/components/BudgetProgress";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Zap, Users } from "lucide-react";
import { DateRange } from "react-day-picker";

const spendingTrend = [
  { date: "Jan 1", amount: 450 },
  { date: "Jan 8", amount: 520 },
  { date: "Jan 15", amount: 480 },
  { date: "Jan 22", amount: 590 },
  { date: "Jan 29", amount: 710 },
  { date: "Feb 5", amount: 680 },
  { date: "Feb 12", amount: 750 },
];

const providerData = [
  { name: "OpenAI", value: 4200, color: "hsl(var(--chart-1))" },
  { name: "Anthropic", value: 2800, color: "hsl(var(--chart-2))" },
  { name: "Google", value: 1500, color: "hsl(var(--chart-3))" },
  { name: "Cohere", value: 800, color: "hsl(var(--chart-4))" },
];

const modelUsage = [
  { model: "GPT-4", requests: 2400 },
  { model: "Claude-3", requests: 1800 },
  { model: "GPT-3.5", requests: 3200 },
  { model: "Gemini", requests: 1200 },
];

const budgets = [
  { name: "Finance", spent: 4200, budget: 5000 },
  { name: "R&D", spent: 7800, budget: 10000 },
  { name: "CloudOps", spent: 3400, budget: 4000 },
];

const Dashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState("1m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your AI spending and usage metrics</p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Spend"
            value="$9,342"
            change={12.5}
            trend="up"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="Total Requests"
            value="8,643"
            change={8.2}
            trend="up"
            icon={<Zap className="h-5 w-5" />}
          />
          <MetricCard
            title="Avg Cost/Request"
            value="$1.08"
            change={-3.1}
            trend="down"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            title="Active Projects"
            value="12"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spending Trend */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={spendingTrend}>
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
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Spending by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {providerData.map((entry, index) => (
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
                {providerData.map((provider) => (
                  <div key={provider.name} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: provider.color }}
                    />
                    <span className="text-sm text-muted-foreground">{provider.name}</span>
                    <span className="ml-auto text-sm font-semibold">${provider.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model Usage */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Requests by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelUsage}>
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
          <BudgetProgress items={budgets} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
