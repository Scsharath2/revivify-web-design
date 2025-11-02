import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingTable } from "@/components/LoadingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Download, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useApiRequests } from "@/hooks/useApiRequests";
import { useProviders } from "@/hooks/useProviders";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import { format, subDays, subMonths } from "date-fns";
import { toast } from "sonner";

const Requests = () => {
  const [selectedFilter, setSelectedFilter] = useState("1m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [provider, setProvider] = useState("all");
  const [businessUnit, setBusinessUnit] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: providers } = useProviders();
  const { businessUnits } = useBusinessUnits();

// Calculate and memoize date range based on filter
  const computedRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { from: dateRange.from, to: dateRange.to };
    }
    const today = new Date();
    switch (selectedFilter) {
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

  const { data: requests, isLoading } = useApiRequests({
    dateRange: computedRange,
    provider,
    businessUnit,
    searchQuery,
  });

  const handleExport = () => {
    if (!requests || requests.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content
    const headers = ["Timestamp", "Provider", "Model", "Business Unit", "Tokens", "Cost", "Status", "Response Time"];
    const rows = requests.map(req => [
      format(new Date(req.request_timestamp), "yyyy-MM-dd HH:mm:ss"),
      req.providers?.display_name || "N/A",
      req.models?.display_name || "N/A",
      req.business_units?.name || "N/A",
      req.total_tokens.toString(),
      Number(req.cost).toFixed(4),
      req.status_code?.toString() || "N/A",
      req.response_time_ms ? `${req.response_time_ms}ms` : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `api-requests-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${requests.length} requests to CSV`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Requests</h1>
          <p className="text-muted-foreground mt-1">View and analyze all API requests</p>
        </div>

        {/* Filters */}
        <div className="space-y-4 animate-fade-in animate-stagger-1">
          <FilterBar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 transition-all duration-300 focus:shadow-md"
                />
              </div>
            </div>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[180px] transition-all duration-300 hover:border-primary">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers?.map((p) => (
                  <SelectItem key={p.id} value={p.display_name}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={businessUnit} onValueChange={setBusinessUnit}>
              <SelectTrigger className="w-[180px] transition-all duration-300 hover:border-primary">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {businessUnits?.map((bu) => (
                  <SelectItem key={bu.id} value={bu.name}>
                    {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="animate-fade-in">
            <LoadingTable />
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="animate-fade-up">
            <EmptyState
              icon={FileText}
              title="No Requests Found"
              description="No API requests match your current filters. Try adjusting the date range or removing some filters to see more results."
            />
          </div>
        ) : (
          <Card className="animate-fade-in animate-stagger-2 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Request Log</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleExport}
                className="hover-scale"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Business Unit</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request, index) => (
                      <TableRow 
                        key={request.id} 
                        className="hover:bg-muted/50 transition-colors duration-200 cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(request.request_timestamp), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="transition-all duration-200 hover:bg-primary/10">
                            {request.providers?.display_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {request.models?.display_name}
                        </TableCell>
                        <TableCell>{request.business_units?.name || "N/A"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {request.total_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          ${Number(request.cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "default" : "destructive"}
                            className={request.status_code && request.status_code >= 200 && request.status_code < 300 ? "bg-success hover-scale" : "hover-scale"}
                          >
                            {request.status_code ? request.status_code : "N/A"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Requests;
