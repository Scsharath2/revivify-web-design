import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, MemoryStick, Clock, RefreshCw, Database, Zap } from "lucide-react";
import { toast } from "sonner";

const systemMetrics = [
  { label: "CPU Usage", value: "24%", icon: Cpu, color: "text-chart-1" },
  { label: "Memory Usage", value: "3.2 GB", icon: MemoryStick, color: "text-chart-2" },
  { label: "Disk Usage", value: "42%", icon: HardDrive, color: "text-chart-3" },
  { label: "Uptime", value: "72.4 hrs", icon: Clock, color: "text-chart-4" },
];

const Settings = () => {
  const handleRefreshMetrics = () => {
    toast.success("System metrics refreshed");
  };

  const handleClearCache = () => {
    toast.success("Cache cleared successfully");
  };

  const handleOptimizeDB = () => {
    toast.success("Database optimized successfully");
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">System information and maintenance</p>
        </div>

        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Real-time system resource usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {systemMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className={`rounded-lg bg-card p-3 ${metric.color}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {metric.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance & Cache Controls</CardTitle>
            <CardDescription>Optimize system performance and clear cached data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4"
                onClick={handleRefreshMetrics}
              >
                <RefreshCw className="h-5 w-5 text-chart-1" />
                <div className="text-left">
                  <p className="font-semibold">Refresh Metrics</p>
                  <p className="text-xs text-muted-foreground">
                    Update system statistics
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4"
                onClick={handleClearCache}
              >
                <Zap className="h-5 w-5 text-chart-2" />
                <div className="text-left">
                  <p className="font-semibold">Clear Cache</p>
                  <p className="text-xs text-muted-foreground">
                    Remove cached data
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4"
                onClick={handleOptimizeDB}
              >
                <Database className="h-5 w-5 text-chart-3" />
                <div className="text-left">
                  <p className="font-semibold">Optimize Database</p>
                  <p className="text-xs text-muted-foreground">
                    Compact and optimize
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Version</span>
              <Badge variant="outline">v2.4.1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Environment</span>
              <Badge>Production</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Database</span>
              <Badge variant="outline">SQLite</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
              <span className="text-sm text-foreground">2024-02-15</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
